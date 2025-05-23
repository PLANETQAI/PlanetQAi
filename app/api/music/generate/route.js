import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { CreditManager } from "@/lib/credit-stripe-utils";
import axios from "axios";

const prisma = new PrismaClient();

// Constants for credit calculation
const CREDITS_PER_SECOND = 5;
const MIN_GENERATION_DURATION = 10; // Minimum duration in seconds for credit calculation
const DEFAULT_ESTIMATED_DURATION = 15; // Default estimated duration in seconds

/**
 * Format lyrics with timestamps for the Diffrhythm API
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

    // Get estimated duration based on prompt complexity or use default
    // This is a simplified estimation - you might want to implement a more sophisticated algorithm
    const estimatedDuration = Math.max(
      MIN_GENERATION_DURATION,
      Math.ceil(prompt.length / 50) // Simple heuristic: longer prompts might take more time
    );

    // Calculate estimated credits based on prompt length, matching frontend calculation
    // Base cost: 15 credits for prompts up to 200 words
    let estimatedCredits = 15;
    
    // Count words in the prompt
    const wordCount = prompt.split(/\s+/).filter(word => word.length > 0).length;
    
    // Additional cost: 4 credits for every 10 words (or fraction) over 200 words
    if (wordCount > 200) {
      const excessWords = wordCount - 200;
      const excessWordPacks = Math.ceil(excessWords / 10);
      estimatedCredits += excessWordPacks * 4;
    }
    
    console.log(`Diffrhym backend credit calculation: ${wordCount} words = ${estimatedCredits} credits`);

    // Check if user has enough credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user || user.credits < estimatedCredits) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          creditsNeeded: estimatedCredits,
          creditsAvailable: user?.credits || 0,
        },
        { status: 403 }
      );
    }

    // Create initial song record
    // Prepare tags array with metadata
    let songTags = tags ? tags.split(",").map(tag => tag.trim()) : [];
    
    // Add style, tempo, mood, and provider as tags
    songTags.push(`provider:diffrhym`);
    songTags.push(`style:${style || "pop"}`);
    songTags.push(`tempo:${tempo || "medium"}`);
    songTags.push(`mood:${mood || "neutral"}`);
    songTags.push(`started_at:${new Date().toISOString()}`);
    
    const song = await prisma.song.create({
      data: {
        userId,
        title: title || prompt.substring(0, 50),
        prompt,
        audioUrl: "", // Will be updated after generation
        duration: 0, // Will be updated after generation
        creditsUsed: 0, // Will be updated after generation
        tags: songTags,
      },
    });

    // URL and API key for the GoAPI Diffrhythm API
    const url = process.env.DIFFRHYM_API_URL;
    const apiKey = process.env.DIFFRHYM_API_KEY;

    if (!url || !apiKey) {
      throw new Error("Diffrhythm API configuration missing");
    }

    // Determine task type based on estimated duration
    const taskType = estimatedDuration > 30 ? "txt2audio-full" : "txt2audio-base";

    // Create style prompt based on style, tempo, and mood
    const stylePrompt = `${style} music with ${tempo} tempo and ${mood} mood`;

    // Format lyrics with timestamps (simplified version)
    // In a real implementation, you might want to use a more sophisticated algorithm
    const lyrics = formatLyricsWithTimestamps(prompt);

    // Prepare the GoAPI Diffrhythm payload
    const payload = {
      config: {
        service_mode: "async",
        webhook_config: {
          endpoint: `${process.env.NEXT_PUBLIC_APP_URL}/api/music/webhook`,
          secret: "your_webhook_secret" // You should use a secure secret
        }
      },
      input: {
        lyrics: lyrics,
        style_prompt: stylePrompt
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
    
    if (responseData.code !== 200) {
      throw new Error(`API Error: ${responseData.message || 'Unknown error'}`); 
    }
    
    const taskId = responseData.data.task_id;

    if (!taskId) {
      throw new Error("Failed to get task ID from Diffrhythm API");
    }

    // Update the song record with the task ID as a tag
    const updatedTags = [...songTags, `taskId:${taskId}`];
    await prisma.song.update({
      where: { id: song.id },
      data: {
        tags: updatedTags
      }
    });

    // Deduct credits based on estimated duration
    await CreditManager.deductCreditsForSongGeneration(
      userId,
      estimatedDuration,
      song.id
    );

    // Return the song ID and task ID for the frontend to poll
    return NextResponse.json({
      success: true,
      message: "Diffrhythm music generation started",
      songId: song.id,
      estimatedCredits,
      taskId: taskId,
    });
  } catch (error) {
    console.error("Music generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate music" },
      { status: 500 }
    );
  }
}
