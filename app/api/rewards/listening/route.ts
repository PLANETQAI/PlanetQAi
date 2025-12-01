import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { points, description, metadata } = await req.json();

  try {
    const reward = await prisma.reward.create({
      data: {
        userId,
        type: "listening",
        points: Math.floor(points),
        description,
        metadata,
      },
    });

    return NextResponse.json({ success: true, reward });
  } catch (err) {
    return NextResponse.json({ error: "Failed to save reward" }, { status: 500 });
  }
}
