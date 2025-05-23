import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    // Get user session
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user credit information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        credits: true,
        maxMonthlyCredits: true,
        totalCreditsUsed: true,
        role: true,
        subscription: {
          select: {
            planName: true,
            status: true,
            currentPeriodEnd: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's recent credit logs
    const creditLogs = await prisma.creditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        amount: true,
        balanceAfter: true,
        description: true,
        createdAt: true,
      },
    });

    // Get user's recent songs
    const recentSongs = await prisma.song.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        creditsUsed: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      credits: user.credits,
      maxMonthlyCredits: user.maxMonthlyCredits,
      totalCreditsUsed: user.totalCreditsUsed,
      role: user.role,
      subscription: user.subscription,
      creditLogs,
      recentSongs,
    });
  } catch (error) {
    console.error("Credit check error:", error);
    return NextResponse.json(
      { error: "Failed to fetch credit information" },
      { status: 500 }
    );
  }
}
