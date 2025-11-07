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
      // Prepare request body according to Sora API spec
      const requestBody = {
        model: 'sora-2',
        prompt: prompt,
        seconds: parseInt(seconds) || 4,
        size: size || '720x1280',
        quality: quality || 'standard'
      };
      
      // Make the API call to OpenAI Sora API
      const response = await fetch('https://api.openai.com/v1/videos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Delete the media record if API call fails
        await prisma.media.delete({
          where: { id: media.id }
        });
        
        throw new Error(data.error?.message || `OpenAI API error: ${response.statusText}`);
      }
      
      if (!data.id) {
        // Delete the media record if response is invalid
        await prisma.media.delete({
          where: { id: media.id }
        });
        throw new Error('Invalid response from OpenAI API: Missing video ID');
      }

      try {
        // Update media record with the video task ID
        const updatedMedia = await prisma.media.update({
          where: { id: media.id },
          data: {
            taskId: data.id,
            status: data.status || 'queued',
            width: parseInt(data.size?.split('x')[0]) || 720,
            height: parseInt(data.size?.split('x')[1]) || 1280,
            duration: parseInt(data.seconds) || 4,
            quality: data.quality || 'standard',
            model: data.model || 'sora-2',
            usage: [
              ...media.usage.filter(tag => !tag.startsWith('status:')),
              `status:${data.status || 'queued'}`,
              `taskId:${data.id}`,
              `model:sora-2`,
              `created_at:${new Date().toISOString()}`
            ],
          },
        });

        // Deduct credits after successful API call and media update
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
            size: data.size,
            seconds: data.seconds,
            quality: data.quality,
            createdAt: data.created_at,
            creditsUsed: VIDEO_GENERATION_CREDITS,
            remainingCredits: user.credits - VIDEO_GENERATION_CREDITS
          }
        });
      } catch (updateError) {
        // If update fails, try to clean up the media record
        await prisma.media.delete({
          where: { id: media.id }
        }).catch(console.error);
        
        throw new Error(`Failed to update media record: ${updateError.message}`);
      }

    } catch (error) {
      // Try to clean up the media record if it still exists
      try {
        await prisma.media.delete({
          where: { id: media.id }
        });
      } catch (deleteError) {
        console.error('Error cleaning up media record:', deleteError);
      }
      
      // Return the original error
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