import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { shareId } = params;
    console.log('Fetching share with ID:', shareId);

    if (!shareId) {
      console.error('No share ID provided');
      return NextResponse.json({ error: 'Share ID is required.' }, { status: 400 });
    }

    const share = await prisma.share.findUnique({
      where: {
        shareableLink: shareId,
      },
      include: {
        songs: {
          include: {
            song: true,
          },
        },
      },
    });

    if (!share) {
      console.error('Share not found for ID:', shareId);
      return NextResponse.json({ error: 'Share not found.' }, { status: 404 });
    }

    console.log('Found share with songs:', share.songs?.length || 0);
    
    // Format the response to ensure consistent structure
    const responseData = {
      ...share,
      songs: share.songs?.map(item => ({
        ...item.song,
        id: item.songId, // Ensure ID is included
        audio_url: item.song.audioUrl || item.song.song_path, // Handle different field names
        title: item.song.title || 'Untitled Track',
        artist: item.song.artist || 'Unknown Artist',
        duration: item.song.duration || 0,
      })) || [],
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('Error in share API:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the share.', details: error.message },
      { status: 500 }
    );
  }
}
