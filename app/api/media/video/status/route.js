import auth from '@/auth';
import prisma from '@/lib/prisma';
import NextResponse from 'next/server';

export async function GET(request) {
  try {
    // Get user session
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const mediaId = searchParams.get('mediaId');

    if (!taskId || !mediaId) {
      return NextResponse.json(
        { error: "Task ID and Media ID are required" },
        { status: 400 }
      );
    }

    // Get the media record
    const media = await prisma.media.findUnique({
      where: { id: mediaId, userId: session.user.id },
    });

    if (!media) {
      return NextResponse.json(
        { error: "Media not found" },
        { status: 404 }
      );
    }

    // Check video status from OpenAI
    const response = await fetch(`https://api.openai.com/v1/videos/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to check video status: ${response.statusText}`);
    }

    const data = await response.json();

    // Update media record with the latest status
    const updatedMedia = await prisma.media.update({
      where: { id: mediaId },
      data: {
        status: data.status,
        progress: data.progress,
        fileUrl: data.video_url || media.fileUrl,
        thumbnailUrl: data.thumbnail_url || media.thumbnailUrl,
        duration: data.seconds || media.duration,
        width: data.size ? parseInt(data.size.split('x')[0]) : media.width,
        height: data.size ? parseInt(data.size.split('x')[1]) : media.height,
        usage: [
          ...(media.tags.filter(tag => !tag.startsWith('status:'))),
          `status:${data.status}`,
          `progress:${data.progress || 0}`,
          ...(data.video_url ? ['has_video:true'] : []),
          ...(data.thumbnail_url ? ['has_thumbnail:true'] : [])
        ],
      },
    });

    return NextResponse.json({
      success: true,
      status: data.status,
      progress: data.progress || 0,
      videoUrl: data.video_url,
      thumbnailUrl: data.thumbnail_url,
      media: updatedMedia
    });

  } catch (error) {
    console.error("Video status check error:", error);
    return NextResponse.json(
      { 
        error: "Failed to check video status",
        details: error.message 
      },
      { status: 500 }
    );
  }
}
