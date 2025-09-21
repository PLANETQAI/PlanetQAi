import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_CREDITS = 10;

export async function POST() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if user has enough credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.credits < BASE_CREDITS) {
      return NextResponse.json(
        { error: `Insufficient credits. You need at least ${BASE_CREDITS} credits to start a chat.` }, 
        { status: 402 }
      );
    }
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session: {
            type: "realtime",
            model: "gpt-realtime",
          },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to generate token" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Generated token:", data.value);

    // Deduct credits after successful token generation
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: { decrement: BASE_CREDITS },
        totalCreditsUsed: { increment: BASE_CREDITS }
      },
      select: { credits: true }
    });

    // Create credit log
    await prisma.creditLog.create({
      data: {
        userId,
        amount: -BASE_CREDITS,
        balanceAfter: updatedUser.credits,
        description: `Used ${BASE_CREDITS} credits for chat session`
      }
    });

    return NextResponse.json({ 
      token: data.value,
      remainingCredits: updatedUser.credits
    });
  } catch (error) {
    console.error("Token error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" }, 
      { status: 500 }
    );
  }
}
