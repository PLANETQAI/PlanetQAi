import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request, { params }) {
  try {
    const { shareId, songId } = params;

    if (!shareId || !songId) {
      return NextResponse.json({ error: 'Share ID and Song ID are required.' }, { status: 400 });
    }

    await prisma.songsOnShares.delete({
      where: {
        shareId_songId: {
          shareId,
          songId,
        },
      },
    });

    return NextResponse.json({ message: 'Song removed from share successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Error removing song from share:', error);
    return NextResponse.json({ error: 'An error occurred while removing the song from the share.' }, { status: 500 });
  }
}
