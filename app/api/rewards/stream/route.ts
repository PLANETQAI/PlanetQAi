// /app/api/rewards/stream/route.ts
import { getAuthenticatedUser } from "@/lib/api-auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  // Optionally, you can restrict to authenticated users
     const user = await getAuthenticatedUser();
     if (!user) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
     }

  try {
    // Fetch all rewards, include user info
    const rewards = await prisma.reward.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        user: { 
          select: { 
            id: true, 
            fullName: true 
          } 
        },
      },
    });

    // Transform the data to match frontend expectations
    const transformedRewards = rewards.map(reward => ({
      id: reward.id,
      points: reward.points,
      createdAt: reward.createdAt.toISOString(),
      user: {
        id: reward.user.id,
        fullName: reward.user.fullName
      }
    }));

    return NextResponse.json(transformedRewards);
  } catch (err) {
    console.error("Failed to fetch rewards:", err);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}