// app/api/songs/public/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper function to calculate price based on credits
function calculatePrice(credits) {
  // Calculate price as credits * 0.05 (5 cents per credit)
  // This is based on the average of your credit packages
  const price = credits * 0.05;
  return parseFloat(price.toFixed(2));
}

export async function GET() {
  try {
    // Get all public songs
    const songs = await prisma.song.findMany({
      where: { isForSale: true },
      include: {
        User: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format songs with calculated price
    const formattedSongs = songs.map(song => {
      const credits = song.creditsUsed || 1;
      const price = calculatePrice(credits);
      
      return {
        id: song.id,
        title: song.title,
        prompt: song.prompt,
        audioUrl: song.audioUrl,
        thumbnailUrl: song.thumbnailUrl,
        duration: song.duration,
        creditsUsed: credits,
        price: price,
        isPublic: song.isPublic,
        tags: song.tags,
        createdAt: song.createdAt,
        provider: song.provider,
        quality: song.quality || 'pending',
        userId: song.userId,
        userName: song.user?.fullName,
        userEmail: song.user?.email,
      };
    });

    return NextResponse.json({ songs: formattedSongs });
  } catch (error) {
    console.error('Error fetching public songs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public songs' },
      { status: 500 }
    );
  }
}