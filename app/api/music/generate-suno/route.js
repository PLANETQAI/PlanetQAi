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

    // Get estimated duration based on prompt complexity or use default
    const estimatedDuration = Math.max(
      MIN_GENERATION_DURATION,
      Math.ceil(prompt.length / 50) // Simple heuristic: longer prompts might take more time
    );

    // Calculate estimated credits based on prompt length, matching frontend calculation
    // Base cost: 24 credits for Suno generation
    let estimatedCredits = 24;
    
    // Count words in the prompt
    const wordCount = prompt.split(/\s+/).filter(word => word.length > 0).length;
    
    // Additional cost: 5 credits for every 10 words (or fraction) over 200 words
    if (wordCount > 200) {
      const excessWords = wordCount - 200;
      const excessWordPacks = Math.ceil(excessWords / 10);
      estimatedCredits += excessWordPacks * 5;
    }
    
    console.log(`Suno backend credit calculation: ${wordCount} words = ${estimatedCredits} credits`);

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
      message: "Suno music generation started",
      songId: song.id,
      estimatedCredits,
      taskId: taskId,
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
