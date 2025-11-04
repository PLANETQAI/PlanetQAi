import { auth } from "@/auth";
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Constants
const VIDEO_GENERATION_CREDITS = 200; // 200 credits per video generation

export async function POST(req) {
  try {
    // Get user session
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { prompt, title, tags, quality = "standard", duration = 8 } = body;

    const seconds = duration.toString();
    const size = quality === 'hd' ? '1080x1920' : '720x1280';

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Check if user has enough credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, credits: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.credits < VIDEO_GENERATION_CREDITS) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          creditsNeeded: VIDEO_GENERATION_CREDITS,
          creditsAvailable: user.credits,
        },
        { status: 403 }
      );
    }

    // Create media record before making the API call
    const media = await prisma.media.create({
      data: {
        userId,
        title: title || prompt.substring(0, 50),
        description: prompt,
        mediaType: 'video',
        quality,
        duration: parseInt(duration),
        status: 'queued',
        fileUrl: '',
        isPublic: false,
        usage: [
          'provider:openai',
          `quality:${quality}`,
          `size:${size}`,
          'status:queued',
          `credits:${VIDEO_GENERATION_CREDITS}`,
          `duration:${duration}`,
          ...(tags ? tags.split(',').map(tag => tag.trim()) : [])
        ],
      },
    });

    try {
      // Make the API call to OpenAI
      const formData = new FormData();
      formData.append('model', 'sora-2');
      formData.append('prompt', prompt);
      formData.append('seconds', seconds);
      formData.append('size', size);
      formData.append('quality', quality);
      formData.append('duration', parseInt(duration));
      
      const response = await fetch('https://api.openai.com/v1/videos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.id) {
        throw new Error('Invalid response from OpenAI API');
      }

      // Update media record with the video task ID
      const updatedMedia = await prisma.media.update({
        where: { id: media.id },
        data: {
          taskId: data.id,
          status: data.status || 'queued',
          usage: [
            ...media.usage.filter(tag => !tag.startsWith('status:')),
            `status:${data.status || 'queued'}`,
            `taskId:${data.id}`,
            `model:sora-2`,
            `created_at:${new Date().toISOString()}`
          ],
        },
      });

      // Deduct credits after successful API call
      await prisma.user.update({
        where: { id: userId },
        data: {
          credits: {
            decrement: VIDEO_GENERATION_CREDITS
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: "Video generation started",
        media: {
          id: updatedMedia.id,
          taskId: data.id,
          status: data.status,
          creditsUsed: VIDEO_GENERATION_CREDITS,
          remainingCredits: user.credits - VIDEO_GENERATION_CREDITS
        }
      });

    } catch (error) {
      // Update media record with error status
      await prisma.media.update({
        where: { id: media.id },
        data: {
          status: 'failed',
          usage: [
            ...media.usage.filter(tag => !tag.startsWith('status:')),
            'status:failed',
            `error:${error.message.replace(/\s+/g, '_')}`
          ],
        },
      });

      throw error;
    }

  } catch (error) {
    console.error("Video generation error:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate video",
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [videos, total] = await Promise.all([
      prisma.media.findMany({
        where: {
          userId: session.user.id,
          mediaType: 'video'
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.media.count({
        where: {
          userId: session.user.id,
          mediaType: 'video'
        }
      })
    ])

    return NextResponse.json({
      videos,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit
      }
    })

  } catch (error) {
    console.error('Error fetching videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    )
  }
}