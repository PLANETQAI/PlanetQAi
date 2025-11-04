import { auth } from "@/auth";
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Constants
const IMAGE_GENERATION_CREDITS = 100;

export async function POST(req) {
  try {
    // Get user session
   const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { prompt, title, tags, style, quality = "standard", n = 1 } = body;

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

    if (user.credits < IMAGE_GENERATION_CREDITS) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          creditsNeeded: IMAGE_GENERATION_CREDITS,
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
        mediaType: 'image',
        quality,
        fileUrl: '', // Will be updated after generation
        isPublic: false,
        status: 'pending',
        usage: {
          provider: 'openai',
          quality,
          status: 'pending',
          credits: IMAGE_GENERATION_CREDITS,
          tags: tags ? tags.split(',').map(tag => tag.trim()) : []
        }
      },
    });

    try {
      // Make the API call to OpenAI
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: prompt,
          n: Math.min(parseInt(n), 4), // Limit to max 4 images
          size: quality === "hd" ? "1024x1024" : "1024x1024",
          quality: quality
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Image generation response",data);
      
      if (!data.data || !data.data[0]?.url) {
        throw new Error('Invalid response from OpenAI API');
      }


const imageUrl = data.data[0].url;
const revisedPrompt = data.data[0].revised_prompt || prompt;
      // Update media record with the generated image URL
// Update media record with the generated image URL
    const updatedMedia = await prisma.media.update({
      where: { id: media.id },
      data: {
        fileUrl: imageUrl,
        thumbnailUrl: imageUrl,
        width: 1024,
        height: 1024,
        completedAt: new Date(),
        quality,
        status: 'completed',
        model: 'dall-e-3'
      }
    });

      // Deduct credits after successful generation
      await prisma.user.update({
        where: { id: userId },
        data: {
          credits: {
            decrement: IMAGE_GENERATION_CREDITS
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: "Image generated successfully",
        media: {
          id: updatedMedia.id,
          url: updatedMedia.fileUrl,
          thumbnailUrl: updatedMedia.thumbnailUrl,
          creditsUsed: IMAGE_GENERATION_CREDITS,
          remainingCredits: user.credits - IMAGE_GENERATION_CREDITS
        }
      });

    } catch (error) {
      // Update media record with error status
      const existingUsage = media.usage || {};
      await prisma.media.update({
        where: { id: media.id },
        data: {
          status: 'failed',
          usage: {
            ...existingUsage,
            status: 'failed',
            error: error.message,
          }
        },
      });

      throw error;
    }

  } catch (error) {
    console.error("Media generation error:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate media",
        details: error.message 
      },
      { status: 500 }
    );
  }
}
