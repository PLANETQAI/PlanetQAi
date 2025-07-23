
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
     const session = await auth();
     
     if (!session?.user?.id) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }
 
    // Get all songs by this user
    const songs = await prisma.song.findMany({
      where: { userId: session.user.id },
      select: { id: true, title: true },
    });
    const songIds = songs.map((s) => s.id);
    // Get all purchases for these songs
    const purchases = await prisma.songPurchase.findMany({
      where: { songId: { in: songIds } },
      include: {
        User: { select: { fullName: true, email: true } },
        Song: { select: { title: true } },
      },
    });
    // Calculate total earned
    const totalEarned = purchases.reduce((sum, p) => sum + (p.price || 0), 0);
    return new Response(
      JSON.stringify({
        purchases: purchases.map((p) => ({
          id: p.id,
          songTitle: p.Song.title,
          buyer: p.User.fullName,
          buyerEmail: p.User.email,
          price: p.price,
          purchasedAt: p.purchasedAt,
        })),
        totalEarned,
      }),
      { status: 200 }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
