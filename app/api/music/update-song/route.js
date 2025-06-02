import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    // Get the session to verify the user is authenticated
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const { songId, taskId, audioUrl, status, completedAt } = await request.json();

    // Validate required fields
    if (!songId) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
    }

    // Find the song in the database
    const song = await prisma.song.findUnique({
      where: { id: songId },
      include: { user: true }
    });

    // Check if the song exists and belongs to the current user
    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    if (song.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to update this song' }, { status: 403 });
    }

    // Update the song with the new information
    const updateData = {
      status: status || song.status
    };

    // Only update these fields if they are provided
    if (audioUrl) updateData.audioUrl = audioUrl;
    if (completedAt) updateData.completedAt = new Date(completedAt);

    // Update any tags to reflect the new status
    let tags = song.tags || [];
    // Remove any existing status tags
    tags = tags.filter(tag => !tag.startsWith('status:'));
    // Add the new status tag
    tags.push(`status:${status || 'completed'}`);
    updateData.tags = tags;

    // Update the song in the database
    const updatedSong = await prisma.song.update({
      where: { id: songId },
      data: updateData
    });

    // If the song is now completed, add it to the gallery
    if (status === 'completed' && audioUrl) {
      // Check if this song is already in the gallery
      const existingGalleryItem = await prisma.gallery.findFirst({
        where: {
          userId: session.user.id,
          audioLink: { contains: songId }
        }
      });

      // Only create a gallery entry if one doesn't exist
      if (!existingGalleryItem) {
        await prisma.gallery.create({
          data: {
            userId: session.user.id,
            audioLink: audioUrl,
            isPaid: "true"
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      song: updatedSong
    });
  } catch (error) {
    console.error('Error updating song:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
