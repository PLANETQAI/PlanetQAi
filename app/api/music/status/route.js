import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { CreditManager } from "@/lib/credit-stripe-utils";
import axios from "axios";

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    // Get user session
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the task ID and song ID from the URL
    const url = new URL(req.url);
    const taskId = url.searchParams.get("taskId");
    const songId = url.searchParams.get("songId");

    if (!taskId || !songId) {
      return NextResponse.json(
        { error: "Task ID and Song ID are required" },
        { status: 400 }
      );
    }

    // Check if the song exists and belongs to the user
    const song = await prisma.song.findUnique({
      where: {
        id: songId,
        userId: session.user.id,
      },
    });

    if (!song) {
      return NextResponse.json(
        { error: "Song not found or unauthorized" },
        { status: 404 }
      );
    }

    // Get the API URL and key from environment variables
    const apiUrl = process.env.DIFFRHYM_API_URL;
    const apiKey = process.env.DIFFRHYM_API_KEY;

    if (!apiUrl || !apiKey) {
      throw new Error("Diffrhythm API configuration missing");
    }

    // Check the status of the task with the GoAPI Diffrhythm API
    // Following the documentation at https://goapi.ai/docs/diffrythm/get-task
    const statusUrl = `${apiUrl}/${taskId}`;
    const response = await axios.get(statusUrl, {
      headers: {
        "x-api-key": apiKey,
        "Accept": "application/json"
      }
    });

    // Extract the task data from the response
    // The API returns a structure with code, data, and message fields
    const responseData = response.data;
    
    if (responseData.code !== 200) {
      throw new Error(`API Error: ${responseData.message || 'Unknown error'}`); 
    }
    
    // Get the full task data to return to the frontend
    const taskData = responseData.data;
    console.log('Task data:', taskData);
    // If the task is completed and has audio URL, update the database
    if (taskData.status === "completed" && taskData.output && taskData.output.audio_url) {
      // Extract the audio URL
      const audioUrl = taskData.output.audio_url;
      
      // Extract lyrics if available
      const lyrics = taskData.input.lyrics || "";
      
      // Generate a cover image URL (this might be available in the API response)
      // For now, we'll use a placeholder
      const coverImageUrl = taskData.output.cover_image || `https://via.placeholder.com/300?text=${encodeURIComponent(song.title)}`;
      
      // If the song is completed and doesn't have an audio URL yet, update it
      if (!song.audioUrl) {
        // Calculate actual duration (if available in API response, otherwise estimate)
        const actualDuration = taskData.output.duration || 60; // Default to 60 seconds
        
        // Calculate generation time if we have started_at and ended_at
        let generationTime = null;
        if (taskData.meta && taskData.meta.started_at && taskData.meta.ended_at) {
          const startedAt = new Date(taskData.meta.started_at);
          const endedAt = new Date(taskData.meta.ended_at);
          if (startedAt.getTime() > 0 && endedAt.getTime() > 0) {
            generationTime = Math.round((endedAt - startedAt) / 1000); // in seconds
          }
        }
        
        // Check if song exists before update and if credits have been deducted
        const songBeforeUpdate = await prisma.song.findUnique({
          where: { id: songId },
          select: { id: true, userId: true, tags: true, creditsUsed: true }
        });
        
        if (!songBeforeUpdate) {
          throw new Error(`Song not found with ID: ${songId}`);
        }
        
        // Check if credits have already been deducted
        console.log('Song tags:', songBeforeUpdate.tags);
        
        // Check if credits have already been deducted by looking at the tags
        const creditsDeducted = songBeforeUpdate.tags && songBeforeUpdate.tags.some(tag => tag === 'credits_deducted:true');
        
        // Get the estimated credits from the tags
        const estimatedCreditsTag = songBeforeUpdate.tags && songBeforeUpdate.tags.find(tag => tag.startsWith('estimated_credits:'));
        const estimatedCredits = estimatedCreditsTag ? 
          parseInt(estimatedCreditsTag.split(':')[1], 10) : 50; // Default to 50 if not found
        
        console.log(`Song generation successful. Credits deducted: ${creditsDeducted}, Estimated credits: ${estimatedCredits}`);
        
        // Only deduct credits if they haven't been deducted yet
        if (!creditsDeducted) {
          try {
            // Use a transaction to ensure atomicity
            await prisma.$transaction(async (tx) => {
              // Get the user
              const user = await tx.user.findUnique({
                where: { id: songBeforeUpdate.userId },
                select: { id: true, credits: true }
              });
              
              if (!user) {
                console.error(`User not found for song ${songId}`);
                return; // Skip credit deduction but don't fail the request
              }
              
              console.log(`Deducting ${estimatedCredits} credits for successful generation. User has ${user.credits} credits.`);
              
              // Deduct credits - make sure not to go below zero
              const creditsToDeduct = Math.min(estimatedCredits, user.credits);
              const updatedUser = await tx.user.update({
                where: { id: user.id },
                data: {
                  credits: { decrement: creditsToDeduct },
                  totalCreditsUsed: { increment: creditsToDeduct }
                }
              });
              
              // Log the credit usage
              await tx.creditLog.create({
                data: {
                  userId: user.id,
                  amount: -creditsToDeduct,
                  balanceAfter: updatedUser.credits,
                  description: "Song generation (successful)",
                  relatedEntityId: songId,
                  relatedEntityType: "Song"
                }
              });
              
              // Update the song with credits used
              await tx.song.update({
                where: { id: songId },
                data: {
                  creditsUsed: creditsToDeduct
                }
              });
            });
          } catch (error) {
            // Log the error but don't fail the request
            console.error('Error deducting credits:', error);
            // We'll still continue with the song update
          }
        }
        
        // Debug log before update
        console.log('Updating song in database:', {
          songId,
          audioUrl,
          lyrics: lyrics ? 'Has lyrics' : 'No lyrics',
          duration: actualDuration,
          thumbnailUrl: coverImageUrl ? 'Has thumbnail' : 'No thumbnail',
        });
        
        // Update the song with the audio URL and other details
        const updatedTags = [
          ...(songBeforeUpdate.tags || []).filter(tag => !tag.startsWith('credits_deducted:')),
          'credits_deducted:true',
          'updated_by_status_endpoint'
        ];
        
        const updatedSong = await prisma.song.update({
          where: { id: songId },
          data: {
            audioUrl,
            lyrics,
            duration: actualDuration,
            isPublic: false,
            thumbnailUrl: coverImageUrl,
            completedAt: new Date(),
            generationTime,
            provider: 'diffrhym', // Explicitly set provider
            tags: updatedTags
          },
        });
        
        // Debug log after update
        console.log('Song updated successfully:', updatedSong);
        
        // Add the song to the user's gallery
        await prisma.gallery.create({
          data: {
            userId: session.user.id,
            audioLink: audioUrl,
            isPaid: "true", // Credits have been deducted now
          },
        });
      }
    }

    // Return the complete task data to the frontend
    // This allows the frontend to handle the data directly
    return NextResponse.json(taskData);
  } catch (error) {
    console.error("Music status check error:", error);
    return NextResponse.json(
      { error: "Failed to check music generation status" },
      { status: 500 }
    );
  }
}
