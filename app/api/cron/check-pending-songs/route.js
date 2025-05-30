import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import axios from 'axios';

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// This endpoint can be called by a cron job every few minutes
// to check the status of pending songs and update them when they're ready
export async function GET(req) {
  try {
    // Get the API URL and key from environment variables
    const apiUrl = process.env.DIFFRHYM_API_URL;
    const apiKey = process.env.DIFFRHYM_API_KEY;

    if (!apiUrl || !apiKey) {
      throw new Error("Diffrhythm API configuration missing");
    }

    // Check for authentication if needed (using a secret key for cron jobs)
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret");
    
    // Verify the secret matches your environment variable
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all songs that are pending (no audioUrl or have a pending status tag)
    const pendingSongs = await prisma.song.findMany({
      where: {
        OR: [
          { audioUrl: null },
          { audioUrl: "" },
          { tags: { has: "status:pending" } },
          { tags: { has: "credits_deducted:false" } }
        ],
        // Only check songs that are not too old (e.g., created in the last 24 hours)
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      include: {
        user: true
      }
    });

    console.log(`Found ${pendingSongs.length} pending songs to check`);

    // Process each pending song
    const results = await Promise.all(
      pendingSongs.map(async (song) => {
        try {
          // Find the taskId in the song tags
          const taskIdTag = song.tags?.find(tag => tag.startsWith('taskId:'));
          if (!taskIdTag) {
            console.log(`Song ${song.id} has no taskId tag, skipping`);
            return { songId: song.id, status: 'skipped', reason: 'no-task-id' };
          }

          const taskId = taskIdTag.split(':')[1];
          console.log(`Checking status for song ${song.id} with task ${taskId}`);

          // Check the status of the task with the GoAPI Diffrhythm API
          const statusUrl = `${apiUrl}/${taskId}`;
          const response = await axios.get(statusUrl, {
            headers: {
              "x-api-key": apiKey,
              "Accept": "application/json"
            }
          });

          // Extract the task data from the response
          const responseData = response.data;
          
          if (responseData.code !== 200) {
            console.log(`API Error for song ${song.id}: ${responseData.message || 'Unknown error'}`);
            return { songId: song.id, status: 'error', reason: responseData.message };
          }
          
          // Get the full task data
          const taskData = responseData.data;
          console.log(`Task ${taskId} status: ${taskData.status}`);

          // If the task is completed and has audio URL, update the database
          if (taskData.status === "completed" && taskData.output && taskData.output.audio_url) {
            // Extract the audio URL
            const audioUrl = taskData.output.audio_url;
            
            // Extract lyrics if available
            const lyrics = taskData.input.lyrics || "";
            
            // Generate a cover image URL (this might be available in the API response)
            const coverImageUrl = taskData.output.cover_image || `https://via.placeholder.com/300?text=${encodeURIComponent(song.title)}`;
            
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

            // Check if credits have already been deducted
            const hasCreditDeductionTag = song.tags && song.tags.some(tag => tag === 'credits_deducted:true');
            
            // Use a transaction to update the song and deduct credits if needed
            await prisma.$transaction(async (tx) => {
              // Update the song with the audio URL and other details
              const updatedTags = [
                ...(song.tags || []).filter(tag => 
                  !tag.startsWith('status:') && 
                  !tag.startsWith('credits_deducted:')
                ),
                'status:completed',
                hasCreditDeductionTag ? 'credits_deducted:true' : 'credits_deducted:false'
              ];
              
              const updatedSong = await tx.song.update({
                where: { id: song.id },
                data: {
                  audioUrl,
                  lyrics,
                  duration: actualDuration,
                  thumbnailUrl: coverImageUrl,
                  completedAt: new Date(),
                  generationTime,
                  tags: updatedTags
                },
              });
              
              // Only deduct credits if they haven't been deducted yet
              if (!hasCreditDeductionTag) {
                // Get the estimated credits from the song or use a default value
                const estimatedCredits = song.creditsUsed || 10;
                
                // Make sure not to deduct more credits than the user has
                const creditsToDeduct = Math.min(estimatedCredits, song.user.credits);
                
                // Update the user's credits
                const updatedUser = await tx.user.update({
                  where: { id: song.userId },
                  data: {
                    credits: { decrement: creditsToDeduct },
                    totalCreditsUsed: { increment: creditsToDeduct }
                  }
                });
                
                // Log the credit usage
                await tx.creditLog.create({
                  data: {
                    userId: song.userId,
                    amount: -creditsToDeduct,
                    balanceAfter: updatedUser.credits,
                    description: "Song generation (completed)",
                    relatedEntityType: "Song",
                    relatedEntityId: song.id
                  }
                });
                
                // Update the song with the credits used
                await tx.song.update({
                  where: { id: song.id },
                  data: {
                    creditsUsed: creditsToDeduct,
                    tags: [...updatedTags.filter(tag => tag !== 'credits_deducted:false'), 'credits_deducted:true']
                  }
                });
              }
              
              // Add the song to the user's gallery if it's not already there
              const existingGalleryItem = await tx.gallery.findFirst({
                where: {
                  userId: song.userId,
                  audioLink: { contains: song.id }
                }
              });
              
              if (!existingGalleryItem) {
                await tx.gallery.create({
                  data: {
                    userId: song.userId,
                    audioLink: audioUrl,
                    isPaid: "true"
                  }
                });
              }
            });
            
            return { songId: song.id, status: 'updated', audioUrl };
          } else {
            // Song is still pending
            return { songId: song.id, status: 'pending', taskStatus: taskData.status };
          }
        } catch (error) {
          console.error(`Error processing song ${song.id}:`, error);
          return { songId: song.id, status: 'error', error: error.message };
        }
      })
    );

    // Return the results
    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    });
  } catch (error) {
    console.error("Error checking pending songs:", error);
    return NextResponse.json({ error: "Failed to check pending songs" }, { status: 500 });
  }
}
