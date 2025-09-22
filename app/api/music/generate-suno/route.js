import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { CreditManager } from "@/lib/credit-stripe-utils";
import axios from "axios";

const prisma = new PrismaClient();

// Constants for credit calculation
const SUNO_BASE_CREDITS = 85; // Base cost for Suno generation (80 cents in credits)
const EXCESS_WORDS_PACK_SIZE = 10; // Additional credits for every 10 words over 200
const SUNO_EXCESS_WORDS_COST = 2; // Cost per pack of excess words
const WORD_COUNT_THRESHOLD = 200; // Threshold for additional credit costs

/**
 * Suno music generation API endpoint
 * Uses the PiAPI Suno integration
 */
export async function POST(req) {
  try {
    // Get user session
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { prompt, title, tags, style, tempo, mood, lyricsType = 'generate' } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Calculate credits based on word count
    // Count words in the prompt
    const wordCount = prompt.split(/\s+/).filter(word => word.length > 0).length;
    
    // Base cost: 24 credits for Suno generation
    let estimatedCredits = SUNO_BASE_CREDITS;
    
    // Additional cost: 5 credits for every 10 words (or fraction) over 200 words
    if (wordCount > WORD_COUNT_THRESHOLD) {
      const excessWords = wordCount - WORD_COUNT_THRESHOLD;
      const excessWordPacks = Math.ceil(excessWords / EXCESS_WORDS_PACK_SIZE);
      estimatedCredits += excessWordPacks * SUNO_EXCESS_WORDS_COST;
    }
    
    console.log(`Suno backend credit calculation: ${wordCount} words = ${estimatedCredits} credits`);

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
      console.log(`Credit check for user ${userId} (${user?.email}):`);      console.log(`- Available credits: ${user?.credits || 0}`);
      console.log(`- Required credits: ${estimatedCredits}`);
      console.log(`- Has enough credits: ${user && user.credits >= estimatedCredits ? 'YES' : 'NO'}`);
      
      if (!user) {
        throw new Error("User not found");
      }
      
      // Check if user has enough credits
      if (user.credits < estimatedCredits) {
        throw new Error(`Insufficient credits: needed ${estimatedCredits}, have ${user.credits}`);
      }
      
      // Store user info for later use
      userInfo = user;
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

    // Create initial song record
    // Prepare tags array with metadata
    let songTags = Array.isArray(tags) 
  ? tags.map(tag => String(tag).trim()).filter(Boolean)
  : typeof tags === 'string' 
    ? tags.split(',').map(tag => tag.trim()).filter(Boolean)
    : [];
    
    // Add style, tempo, mood, and provider as tags
    songTags.push(`provider:suno`);
    songTags.push(`style:${style || "pop"}`);
    songTags.push(`tempo:${tempo || "medium"}`);
    songTags.push(`mood:${mood || "neutral"}`);
    songTags.push(`started_at:${new Date().toISOString()}`);
    songTags.push(`lyrics_type:${lyricsType}`);
    
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
    
    // Store song record for later use
    songRecord = song;

    // URL and API key for the PiAPI Suno API
    // You'll need to add these to your .env file
    const url = process.env.PIAPI_URL || "https://api.piapi.ai/v1/task";
    const apiKey = process.env.PIAPI_API_KEY;

    if (!apiKey) {
      throw new Error("PiAPI API configuration missing");
    }

    // Create a description that combines all the parameters
    const description = `${prompt}. Style: ${style || "pop"}, Tempo: ${tempo || "medium"}, Mood: ${mood || "neutral"}`;

    // Prepare the PiAPI Suno payload
    const payload = {
      model: "music-u",
      task_type: "generate_music",
      input: {
        gpt_description_prompt: description,
        negative_tags: "",
        lyrics_type: lyricsType, // Can be "generate", "instrumental", or "user"
        seed: -1
      },
      config: {
        service_mode: "public",
        webhook_config: {
          endpoint: `${process.env.NEXT_PUBLIC_APP_URL}/api/music/webhook-suno`,
          secret: "your_webhook_secret" // You should use a secure secret
        }
      }
    };

    // Log the request details for debugging
    console.log('Suno API request URL:', url);
    console.log('Suno API request payload:', JSON.stringify(payload, null, 2));
    console.log('Suno API key available:', !!apiKey);
    
    // Make the API call to PiAPI Suno
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-api-key": apiKey
      }
    });

    // Extract the task ID from the response
    const responseData = response.data;
    
    if (responseData.code !== 200) {
      throw new Error(`API Error: ${responseData.message || 'Unknown error'}`); 
    }
    
    const taskId = responseData.data.task_id;

    if (!taskId) {
      throw new Error("Failed to get task ID from Suno API");
    }

    // Update the song record with the task ID as a tag
    const updatedTags = [...songTags, `taskId:${taskId}`];
    await prisma.song.update({
      where: { id: songRecord.id },
      data: {
        tags: updatedTags
      }
    });

    // We don't deduct credits here - they will be deducted when generation is successful
    console.log(`Checked credits for Suno generation with ${wordCount} words - will deduct ${estimatedCredits} credits on success`);

    // Return the song ID and task ID for the frontend to poll
    return NextResponse.json({
      success: true,
      message: "Suno music generation started",
      songId: songRecord.id,
      estimatedCredits,
      taskId: taskId,
      status: "pending"
    });
  } catch (error) {
    console.error("Suno music generation error:", error);
    
    // Log more detailed error information
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
      
      return NextResponse.json(
        { 
          error: "Failed to generate music with Suno", 
          details: error.response.data,
          status: error.response.status 
        },
        { status: 500 }
      );
    } else if (error.request) {
      // The request was made but no response was received
      console.error("Error request:", error.request);
      return NextResponse.json(
        { error: "No response received from Suno API" },
        { status: 500 }
      );
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error message:", error.message);
      return NextResponse.json(
        { error: "Failed to generate music with Suno", message: error.message },
        { status: 500 }
      );
    }
  }
}
