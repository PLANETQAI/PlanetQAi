import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { CreditManager } from "@/lib/credit-stripe-utils";

const prisma = new PrismaClient();

// Constants for credit calculation
const CREDITS_PER_SECOND = 5;
const MIN_GENERATION_DURATION = 10; // Minimum duration in seconds for credit calculation

export async function POST(req) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { prompt, title, tags, style, tempo, mood } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Get user's current credit balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate credits needed based on prompt length and complexity (simplified test logic)
    const promptComplexityFactor = style === "orchestral" || style === "cinematic" ? 1.5 : 1.0;
    const creditsNeeded = Math.max(
      MIN_GENERATION_DURATION * CREDITS_PER_SECOND,
      Math.ceil(prompt.length / 10 * promptComplexityFactor)
    );

    // Check if user has enough credits
    if (user.credits < creditsNeeded) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          creditsNeeded,
          creditsAvailable: user.credits,
        },
        { status: 403 }
      );
    }

    // Create a test song record with Diffrhym metadata
    const songTitle = title || `Diffrhym Test: ${prompt.substring(0, 30)}...`;
    const songDuration = Math.floor(Math.random() * 60) + 60; // Random duration between 60-120 seconds
    const thumbnailUrl = `https://storage.diffrhym.ai/covers/test_${Date.now()}.jpg`;
    
    const song = await prisma.song.create({
      data: {
        userId,
        title: songTitle,
        prompt,
        audioUrl: `https://storage.diffrhym.ai/songs/test_${Date.now()}.mp3`, // Fake URL
        duration: songDuration,
        creditsUsed: creditsNeeded,
        tags: tags ? tags.split(",").map(tag => tag.trim()) : [style, tempo, mood].filter(Boolean),
        lyrics: `Diffrhym test lyrics generated from prompt: ${prompt}\n\nStyle: ${style || 'default'}\nTempo: ${tempo || 'medium'}\nMood: ${mood || 'neutral'}`,
        isPublic: false,
        thumbnailUrl,
      },
    });

    // Deduct credits from user
    await prisma.$transaction(async (tx) => {
      // Update user credits
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          credits: { decrement: creditsNeeded },
          totalCreditsUsed: { increment: creditsNeeded },
        },
      });

      // Log the credit usage
      await tx.creditLog.create({
        data: {
          userId,
          amount: -creditsNeeded,
          balanceAfter: updatedUser.credits,
          description: "Diffrhym test song generation",
          relatedEntityId: song.id,
          relatedEntityType: "Song",
        },
      });
    });

    // Add to gallery
    await prisma.gallery.create({
      data: {
        userId,
        audioLink: song.audioUrl,
        isPaid: "true",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Diffrhym test song generated successfully",
      song,
      creditsUsed: creditsNeeded,
      creditsRemaining: user.credits - creditsNeeded,
      metadata: {
        style: style || "default",
        tempo: tempo || "medium",
        mood: mood || "neutral",
        duration: songDuration,
        thumbnailUrl
      }
    });
  } catch (error) {
    console.error("Test music generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate test music with Diffrhym" },
      { status: 500 }
    );
  }
}
