import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { headers } from 'next/headers';

const prisma = new PrismaClient();

// Verify webhook signature
function verifyWebhookSignature(signature, payload, secret) {
  // Implement your webhook signature verification logic here
  // This is a placeholder - replace with actual verification
  return true;
}

export async function POST(req) {
  try {
    // Verify webhook signature
    const headersList = headers();
    const signature = headersList.get('x-webhook-signature');
    const secret = process.env.WEBHOOK_SECRET;
    
    // Clone the request to read the body twice (once for verification, once for processing)
    const body = await req.text();
    
    if (!verifyWebhookSignature(signature, body, secret)) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const data = JSON.parse(body);
    const { task_id, status, output, error } = data.data || {};

    if (!task_id) {
      console.error('No task_id in webhook payload');
      return new Response('Missing task_id', { status: 400 });
    }

    // Find the media by task ID
    const media = await prisma.media.findFirst({
      where: { taskId: task_id }
    });

    if (!media) {
      console.error(`Media not found for task ID: ${task_id}`);
      return new Response('Media not found', { status: 404 });
    }

    if (status === 'completed') {
      const imageUrl = output?.image_urls?.[0];
      if (imageUrl) {
        // Update media with the generated image URL
        await prisma.media.update({
          where: { id: media.id },
          data: {
            fileUrl: imageUrl,
            status: 'completed',
            progress: 100,
            completedAt: new Date()
          }
        });

        // Deduct credits if not already done
        if (media.status !== 'completed') {
          await prisma.user.update({
            where: { id: media.userId },
            data: {
              credits: { decrement: media.creditsUsed },
              totalCreditsUsed: { increment: media.creditsUsed }
            }
          });
        }
      }
    } else if (status === 'failed') {
      await prisma.media.update({
        where: { id: media.id },
        data: {
          status: 'failed',
          progress: 0
        }
      });
    }

    return new Response('Webhook processed', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
