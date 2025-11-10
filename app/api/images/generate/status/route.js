import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Enable streaming for this route
export const dynamic = 'force-dynamic';

export async function GET(request) {
  // Create a transform stream for server-sent events
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Get the taskId from query parameters
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return new NextResponse(JSON.stringify({ error: 'Missing taskId' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Function to send SSE
  const sendEvent = (data) => {
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  // Start polling the database for updates
  const pollInterval = setInterval(async () => {
    try {
      const media = await prisma.media.findUnique({
        where: { id: taskId },
        select: {
          id: true,
          status: true,
          progress: true,
          fileUrl: true,
          error: true,
        },
      });

      if (!media) {
        sendEvent({
          error: 'Media not found',
          status: 'error',
        });
        clearInterval(pollInterval);
        writer.close();
        return;
      }

      const eventData = {
        status: media.status,
        progress: media.progress || 0,
        ...(media.fileUrl && { imageUrl: media.fileUrl }),
        ...(media.error && { error: media.error }),
      };

      sendEvent(eventData);

      // Close connection if the process is complete or failed
      if (['completed', 'failed', 'error'].includes(media.status)) {
        clearInterval(pollInterval);
        // Add a small delay before closing to ensure the final message is sent
        setTimeout(() => writer.close(), 100);
      }
    } catch (error) {
      console.error('Error polling media status:', error);
      sendEvent({
        error: 'Error checking status',
        status: 'error',
      });
      clearInterval(pollInterval);
      writer.close();
    }
  }, 1000); // Poll every second

  // Clean up on client disconnect
  request.signal.addEventListener('abort', () => {
    clearInterval(pollInterval);
    writer.close();
  });

  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
