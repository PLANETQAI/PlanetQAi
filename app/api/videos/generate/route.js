// app/api/videos/generate/route.js
import { auth } from "@/auth";
import { uploadToCloudinary } from '@/lib/cloudinary';
import prisma from '@/lib/prisma';
import axios from "axios";

// Constants for credit calculation
const VIDEO_GENERATION_CREDITS = 40; // Higher cost for video generation
const POLLING_INTERVAL = 3000; // 3 seconds (videos take longer)
const MAX_POLLING_ATTEMPTS = 60; 

// Reuse the same stream helper
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
  const { stream, send, close } = createStreamResponse();

  (async () => {
    try {
      const session = await auth();
      if (!session) {
        send({ error: "Unauthorized" });
        return close();
      }

      const userId = session.user.id;
      const body = await req.json();
      const { 
        prompt, 
        negative_prompt = 'blurry, low quality, distorted, static, text, watermark, logo, signature, bad quality, low resolution',
        mediaId,
        prompt_image // New field for image-to-video
      } = body;

      if (!prompt && !prompt_image) {
        send({ error: "Prompt or prompt_image is required" });
        return close();
      }

      // Determine the input for the goapi.ai request
      let goApiInput;
      if (prompt_image) {
        goApiInput = {
          image_url: prompt_image,
          prompt: prompt || '', // Prompt can be optional for image-to-video
          aspect_ratio: videoConfig.aspect_ratio,
          duration: videoConfig.duration,
          resolution: videoConfig.resolution,
          generate_audio: false
        };
      } else {
        goApiInput = {
          prompt,
          negative_prompt,
          aspect_ratio: videoConfig.aspect_ratio,
          duration: videoConfig.duration,
          resolution: videoConfig.resolution,
          generate_audio: false
        };
      }

      // Get or create media record
      let media;
      const mediaData = {
        title: prompt || 'Video from image', // Use prompt or a default title
        description: prompt || 'Video generated from an image', // Use prompt or a default description
        mediaType: 'video',
        status: 'processing',
        progress: 0,
        userId,
        width: videoConfig.width,
        height: videoConfig.height,
        mimeType: 'video/mp4',
        // Store prompt_image if available
        ...(prompt_image && { imageUrl: prompt_image }),
      };

      if (mediaId) {
        media = await prisma.media.update({
          where: { id: mediaId },
          data: mediaData,
        });
      } else {
        media = await prisma.media.create({ data: mediaData });
      }

      send({
        status: 'queued',
        taskId: media.id,
        progress: 0,
        message: 'Starting video generation...'
      });

      // Make API call to generate video
      const apiKey = process.env.PIAPI_API_KEY;
      const response = await axios.post(
        'https://api.goapi.ai/api/v1/task',
        {
          model: "veo3",
          task_type: "veo3-video-fast",
          input: goApiInput, // Use the dynamically created input
          config: {
            webhook_config: {
              endpoint: `${process.env.NEXT_PUBLIC_APP_URL}/api/videos/webhook`,
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
      console.log('[VideoGen] API Response:', responseData);
      
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
        message: 'Video generation in progress...'
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
            message: 'Generating video...'
          });

          if (statusData.status === 'completed') {
            const videoUrl = statusData.output?.video;
            if (videoUrl) {
              // Upload to Cloudinary
              const cloudinaryUploadResult = await uploadToCloudinary(videoUrl, `generated-video-${media.id}`);
              const cloudinaryUrl = cloudinaryUploadResult.secure_url;

              // Update media with final Cloudinary URL
              await prisma.media.update({
                where: { id: media.id },
                data: {
                  fileUrl: cloudinaryUrl, // Use the Cloudinary URL
                  status: 'completed',
                  progress: 100,
                  completedAt: new Date()
                }
              });

              // Deduct credits
              await prisma.user.update({
                where: { id: userId },
                data: {
                  credits: { decrement: VIDEO_GENERATION_CREDITS },
                  totalCreditsUsed: { increment: VIDEO_GENERATION_CREDITS }
                }
              });

              send({
                status: 'completed',
                taskId: media.id,
                progress: 100,
                videoUrl,
                message: 'Video generated successfully!'
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
              error: 'Video generation failed',
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
          message: 'Video generation timed out'
        });
      }
    } catch (error) {
      console.error('Video generation error:', error);
      send({
        status: 'error',
        error: 'Internal Server Error',
        message: error.message || 'Failed to generate video'
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