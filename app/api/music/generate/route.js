import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// Constants for credit calculation
const STUDIO_BASE_CREDITS = 80; // Base cost for Q_World Studio generation (50 cents in credits)
const EXCESS_WORDS_PACK_SIZE = 10; // Additional credits for every 10 words over 200
const STUDIO_EXCESS_WORDS_COST = 2; // Cost per pack of excess words
const WORD_COUNT_THRESHOLD = 200; // Threshold for additional credit costs

/**
 * Format lyrics with timestamps for the Q_World Studio API
 * This creates a simple timestamp format [mm:ss.ms] before each line
 * @param {string} text - The raw lyrics or prompt text
 * @returns {string} - Formatted lyrics with timestamps
 */
function formatLyricsWithTimestamps(text) {
  // Split the text into lines
  const lines = text.split('\n').filter(line => line.trim() !== '');
  
  // Calculate average time per line (assuming a 3-minute song)
  const totalDuration = 180; // 3 minutes in seconds
  const timePerLine = totalDuration / (lines.length || 1);
  
  // Format each line with a timestamp
  let formattedLyrics = '';
  let currentTime = 0;
  
  lines.forEach(line => {
    // Format the timestamp as [mm:ss.00]
    const minutes = Math.floor(currentTime / 60);
    const seconds = Math.floor(currentTime % 60);
    const timestamp = `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.00]`;
    
    // Add the timestamped line
    formattedLyrics += `${timestamp} ${line.trim()}\n`;
    
    // Increment the time for the next line
    currentTime += timePerLine;
  });
  
  return formattedLyrics.trim();
}

export async function POST(req) {
  try {
    // Get user session
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { prompt, title, tags, style, tempo, mood } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Calculate credits based on word count
    // Count words in the prompt
    const wordCount = prompt.split(/\s+/).filter(word => word.length > 0).length;
    
    // Base cost: 50 credits for prompts up to 200 words
    let estimatedCredits = STUDIO_BASE_CREDITS;
    
    // Additional cost: 4 credits for every 10 words (or fraction) over 200 words
    if (wordCount > WORD_COUNT_THRESHOLD) {
      const excessWords = wordCount - WORD_COUNT_THRESHOLD;
      const excessWordPacks = Math.ceil(excessWords / EXCESS_WORDS_PACK_SIZE);
      estimatedCredits += excessWordPacks * STUDIO_EXCESS_WORDS_COST;
    }
    
    console.log(`Q_World Studio credit calculation: ${wordCount} words = ${estimatedCredits} credits`);

    // Check if user has enough credits but don't deduct them yet
    // We'll only deduct credits when the generation is successful
    let userInfo, songRecord;
    
    try {
      // First, check if the user exists and has enough credits
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, credits: true, email: true },
      });

      // Add detailed logging to debug credit issues
      // console.log(`Credit check for user ${userId} (${user?.email}):`);
      // console.log(`- Available credits: ${user?.credits || 0}`);
      // console.log(`- Required credits: ${estimatedCredits}`);
      // console.log(`- Has enough credits: ${user && user.credits >= estimatedCredits ? 'YES' : 'NO'}`);
      
      if (!user) {
        throw new Error("User not found");
      }
      
      // Check if user has enough credits
      if (user.credits < estimatedCredits) {
        throw new Error(`Insufficient credits: needed ${estimatedCredits}, have ${user.credits}`);
      }
      
      // Prepare tags array with metadata
      let songTags = tags ? tags.split(",").map(tag => tag.trim()) : [];
      
      // Add style, tempo, mood, and provider as tags
      songTags.push(`provider:q_world_studio`);
      songTags.push(`style:${style || "pop"}`);
      songTags.push(`tempo:${tempo || "medium"}`);
      songTags.push(`mood:${mood || "neutral"}`);
      songTags.push(`started_at:${new Date().toISOString()}`);
      songTags.push(`estimated_credits:${estimatedCredits}`);
      songTags.push(`credits_deducted:false`); // Mark that credits haven't been deducted yet
      
      // Create song record - but don't deduct credits yet
      const song = await prisma.song.create({
        data: {
          userId,
          title: title || prompt.substring(0, 50),
          prompt,
          style: style || "pop",
          audioUrl: "", // Will be updated after generation
          duration: 0, // Will be updated after generation
          creditsUsed: 0, // Will be updated when generation is successful
          tags: songTags,
        },
      });
      
      // Store user and song info for later use
      userInfo = user;
      songRecord = song;

    
      
      console.log(`Checked credits for Diffrhym generation with ${wordCount} words - will deduct ${estimatedCredits} credits on success`);
    } catch (error) {
      // Handle transaction errors
      if (error.message.includes("User not found")) {
        return NextResponse.json(
          {
            error: "User not found",
            creditsNeeded: estimatedCredits,
            creditsAvailable: 0,
          },
          { status: 404 }
        );
      } else if (error.message.includes("Insufficient credits")) {
        return NextResponse.json(
          {
            error: "Insufficient credits",
            creditsNeeded: estimatedCredits,
            creditsAvailable: error.message.match(/have (\d+)/)?.[1] || 0,
            shortfall: estimatedCredits - (error.message.match(/have (\d+)/)?.[1] || 0)
          },
          { status: 403 }
        );
      }
      throw error; // Re-throw other errors
    }

    // URL and API key for the Q_World Studio API
    const url = process.env.DIFFRHYM_API_URL;
    const apiKey = process.env.DIFFRHYM_API_KEY;

    if (!url || !apiKey) {
      throw new Error("Q_World Studio API configuration missing");
    }

    // Determine task type based on prompt length
    // Default to base version for shorter prompts, full version for longer ones
    // Using the already calculated wordCount from above
    const taskType = wordCount > 50 ? "txt2audio-full" : "txt2audio-base";

    // Create style prompt based on style, tempo, and mood
    const stylePrompt = `${style} music with ${tempo} tempo and ${mood} mood`;

    // Create a structured prompt that includes style, tempo, and mood
    const structuredPrompt = `Style: ${style}\nTempo: ${tempo}\nMood: ${mood}\n\nLyrics:\n${prompt}`;
    
    // Format the structured prompt with timestamps
    const lyrics = formatLyricsWithTimestamps(structuredPrompt);

    // Prepare the GoAPI Diffrhythm payload
    const payload = {
      config: {
        service_mode: "async",
        webhook_config: {
          endpoint: `${process.env.NEXT_PUBLIC_APP_URL}/api/music/webhook`,
          secret: process.env.WEBHOOK_SECRET // Use environment variable for security
        }
      },
      input: {
        lyrics: lyrics,
        style_prompt: stylePrompt // Keep the style prompt as well for backward compatibility
      },
      model: "Qubico/diffrhythm",
      task_type: taskType
    };

    // Make the API call to GoAPI Diffrhythm
    // Following the documentation at https://goapi.ai/docs/diffrythm/generate-task
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-api-key": apiKey
      }
    });

    // Extract the task ID from the response
    // The API returns a structure with code, data, and message fields
    const responseData = response.data;
    console.log('Music generation response:', responseData)
    
    if (responseData.code !== 200) {
      throw new Error(`API Error: ${responseData.message || 'Unknown error'}`); 
    }
    
    const taskId = responseData.data.task_id;

    if (!taskId) {
      throw new Error("Failed to get task ID from Diffrhythm API");
    }

    // Update the song record with the task ID as a tag
    const updatedTags = [...songRecord.tags, `taskId:${taskId}`];
    await prisma.song.update({
      where: { id: songRecord.id },
      data: {
        tags: updatedTags
      }
    });

    // Return the song ID and task ID for the frontend to poll
    return NextResponse.json({
      success: true,
      message: "Diffrhythm music generation started",
      songId: songRecord.id,
      estimatedCredits,
      taskId: taskId,
    });
  } catch (error) {
    console.error("Music generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate music: " + error.message },
      { status: 500 }
    );
  }
}
