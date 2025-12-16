import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  const session = await auth();

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { targetUserId } = await req.json();
  const currentUserId = session.user.id;

  if (!targetUserId) {
    return new NextResponse("Target user ID is required", { status: 400 });
  }

  if (currentUserId === targetUserId) {
    return new NextResponse("Cannot follow or unfollow yourself", { status: 400 });
  }

  try {
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId,
          },
        },
      });
      return NextResponse.json({ message: "Unfollowed successfully" });
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      });
      return NextResponse.json({ message: "Followed successfully" });
    }
  } catch (error) {
    console.error("Error following/unfollowing user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(req) {
  const session = await auth();

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // 'followers' or 'following'
  const userId = searchParams.get("userId") || session.user.id; // Defaults to current user if not provided

  if (!type || (type !== "followers" && type !== "following")) {
    return new NextResponse("Invalid or missing 'type' parameter. Must be 'followers' or 'following'.", { status: 400 });
  }

  try {
    let users = [];
    if (type === "following") {
      const followingRelations = await prisma.follow.findMany({
        where: {
          followerId: userId,
        },
        include: {
          following: {
            select: {
              id: true,
              fullName: true,
              profilePictureUrl: true,
            },
          },
        },
      });
      users = followingRelations.map((relation) => relation.following);
    } else if (type === "followers") {
      const followerRelations = await prisma.follow.findMany({
        where: {
          followingId: userId,
        },
        include: {
          follower: {
            select: {
              id: true,
              fullName: true,
              profilePictureUrl: true,
            },
          },
        },
      });
      users = followerRelations.map((relation) => relation.follower);
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching followers/following:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
