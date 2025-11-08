import { auth } from "@/auth";
import prisma from '@/lib/prisma';
import axios from "axios";

// Constants for credit calculation
const IMAGE_GENERATION_CREDITS = 10; // Base cost for image generation
const POLLING_INTERVAL = 2000; // 2 seconds
const MAX_POLLING_ATTEMPTS = 60; // ~2 minutes max wait time

/**
 * Creates a streaming response for server-sent events
 */
function createStreamResponse() {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const send = (data) => {
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  const close = () => {
    writer.close();
  };

  return {
    stream: stream.readable,
    send,
    close,
  };
}

export async function POST(req) {
  // Create SSE response
  const { stream, send, close } = createStreamResponse();

  // Process the request in the background
  (async () => {
    try {
      // Get user session
      const session = await auth();
      if (!session) {
        send({ error: "Unauthorized" });
        return close();
      }

      const userId = session.user.id;
      const body = await req.json();
      const { 
        prompt, 
        aspect_ratio: aspectRatio = '16:9', 
        output_format: outputFormat = 'png',
        mediaId 
      } = body;

      if (!prompt) {
        send({ error: "Prompt is required" });
        return close();
      }

      // Check if user has enough credits
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, credits: true },
      });

      if (!user) {
        send({ error: "User not found" });
        return close();
      }

      if (user.credits < IMAGE_GENERATION_CREDITS) {
        send({
          error: "Insufficient credits",
          creditsNeeded: IMAGE_GENERATION_CREDITS,
          creditsAvailable: user.credits,
        });
        return close();
      }

      // Get or create media record
      let media;
      if (mediaId) {
        // Update existing media record
        media = await prisma.media.update({
          where: { id: mediaId },
          data: {
            status: 'processing',
            progress: 0,
            width: aspectRatio === '16:9' ? 1920 : 1024,
            height: aspectRatio === '16:9' ? 1080 : 1024,
            mimeType: `image/${outputFormat}`,
          },
        });
      } else {
        // Create new media record if no ID provided (for backward compatibility)
        media = await prisma.media.create({
          data: {
            title: `Generated Image - ${new Date().toLocaleString()}`,
            description: prompt,
            mediaType: 'image',
            status: 'processing',
            progress: 0,
            userId: session.user.id,
            width: aspectRatio === '16:9' ? 1920 : 1024,
            height: aspectRatio === '16:9' ? 1080 : 1024,
            mimeType: `image/${outputFormat}`,
          },
        });
      }

      send({
        status: 'queued',
        taskId: media.id,
        progress: 0,
        message: 'Starting image generation...'
      });

      // Make API call to generate image
      const apiKey = process.env.PIAPI_API_KEY;
      const response = await axios.post(
        'https://api.goapi.ai/api/v1/task',
        {
          model: "gemini",
          task_type: "gemini-2.5-flash-image",
          input: {
            prompt,
             output_format: "png",
             aspect_ratio: "16:9"
          },
          config: {
            webhook_config: {
              endpoint: `${process.env.NEXT_PUBLIC_APP_URL}/api/images/webhook`,
              secret: process.env.WEBHOOK_SECRET
            }
          }
        },
        {
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      const responseData = response.data;
      
      if (responseData.code !== 200) {
        throw new Error(`API Error: ${responseData.message || 'Unknown error'}`);
      }

      const taskId = responseData.data.task_id;
      if (!taskId) {
        throw new Error("Failed to get task ID from API");
      }

      // Update media with task ID
      await prisma.media.update({
        where: { id: media.id },
        data: {
          taskId,
          status: 'processing',
          progress: 10
        }
      });

      send({
        status: 'processing',
        taskId: media.id,
        progress: 10,
        message: 'Image generation in progress...'
      });

      // Poll for task completion
      let attempts = 0;
      let completed = false;

      while (!completed && attempts < MAX_POLLING_ATTEMPTS) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));

        try {
          const statusResponse = await axios.get(
            `https://api.goapi.ai/api/v1/task/${taskId}`,
            {
              headers: {
                'X-API-Key': apiKey,
                'Accept': 'application/json'
              }
            }
          );

          const statusData = statusResponse.data.data;
          const progress = 10 + Math.min(80, Math.floor(attempts * 80 / MAX_POLLING_ATTEMPTS));

          // Update progress
          await prisma.media.update({
            where: { id: media.id },
            data: { progress }
          });

          send({
            status: 'processing',
            taskId: media.id,
            progress,
            message: 'Generating image...'
          });

          if (statusData.status === 'completed') {
            const imageUrl = statusData.output?.image_urls?.[0];
            if (imageUrl) {
              // Update media with final URL
              await prisma.media.update({
                where: { id: media.id },
                data: {
                  fileUrl: imageUrl,
                  status: 'completed',
                  progress: 100,
                  completedAt: new Date()
                }
              });

              // Deduct credits
              await prisma.user.update({
                where: { id: userId },
                data: {
                  credits: { decrement: IMAGE_GENERATION_CREDITS },
                  totalCreditsUsed: { increment: IMAGE_GENERATION_CREDITS }
                }
              });

              send({
                status: 'completed',
                taskId: media.id,
                progress: 100,
                imageUrl,
                message: 'Image generated successfully!'
              });
              completed = true;
            }
          } else if (statusData.status === 'failed') {
            await prisma.media.update({
              where: { id: media.id },
              data: {
                status: 'failed',
                progress: 0
              }
            });
            
            send({
              status: 'failed',
              taskId: media.id,
              progress: 0,
              error: 'Image generation failed',
              message: statusData.error?.message || 'Unknown error occurred'
            });
            completed = true;
          }
        } catch (error) {
          console.error('Polling error:', error);
          // Continue polling on error
        }
      }

      if (!completed) {
        await prisma.media.update({
          where: { id: media.id },
          data: {
            status: 'failed',
            progress: 0
          }
        });
        
        send({
          status: 'failed',
          taskId: media.id,
          progress: 0,
          error: 'Timeout',
          message: 'Image generation timed out'
        });
      }
    } catch (error) {
      console.error('Image generation error:', error);
      send({
        status: 'error',
        error: 'Internal Server Error',
        message: error.message || 'Failed to generate image'
      });
    } finally {
      close();
    }
  })();

  // Return the streaming response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
