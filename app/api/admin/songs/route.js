import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req) {
  try {
    // Get the session and check if the user is an admin
    const session = await auth();
    
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build the where clause for search
    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { prompt: { contains: search, mode: 'insensitive' } },
            { user: { fullName: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {};
    
    // Get songs with pagination and include user information
    const [songs, totalSongs] = await Promise.all([
      prisma.song.findMany({
        where,
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
        skip,
        take: limit,
      }),
      prisma.song.count({ where }),
    ]);
    
    // Format the songs for the response with all fields from the Song model
    const formattedSongs = songs.map(song => ({
      id: song.id,
      userId: song.userId,
      title: song.title,
      prompt: song.prompt,
      lyrics: song.lyrics,
      audioUrl: song.audioUrl,
      videoUrl: song.videoUrl,
      thumbnailUrl: song.thumbnailUrl,
      duration: song.duration,
      creditsUsed: song.creditsUsed,
      isLyricsPurchased: song.isLyricsPurchased,
      salePrice: song.salePrice,
      isPublic: song.isPublic,
      isForSale: song.isForSale,
      tags: song.tags,
      alternativeSongs: song.alternativeSongs,
      generationId: song.generationId,
      generationTime: song.generationTime,
      mood: song.mood,
      provider: song.provider,
      startedAt: song.startedAt,
      style: song.style,
      taskId: song.taskId,
      tempo: song.tempo,
      quality: song.quality || 'pending',
      createdAt: song.createdAt,
      updatedAt: song.updatedAt,
      completedAt: song.completedAt,
      // User information
      userName: song.User?.fullName || 'Unknown',
      userEmail: song.User?.email || 'No email',
    }));
    
    // Calculate total pages
    const totalPages = Math.ceil(totalSongs / limit);
    
    return NextResponse.json({
      songs: formattedSongs,
      pagination: {
        page,
        limit,
        totalSongs,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching songs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch songs' },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    // Get the session and check if the user is an admin
    const session = await auth();
    
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await req.json();
    const { songId, action } = body;
    
    if (!songId) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
    }
    
    // Check if the song exists
    const song = await prisma.song.findUnique({
      where: { id: songId },
    });
    
    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }
    
    let result;
    
    // Handle different actions
    switch (action) {
      case 'approve':
        result = await prisma.song.update({
          where: { id: songId },
          data: { quality: 'approved' },
        });
        break;
        
      case 'flag':
        result = await prisma.song.update({
          where: { id: songId },
          data: { quality: 'flagged' },
        });
        break;
        
      case 'makePublic':
        result = await prisma.song.update({
          where: { id: songId },
          data: { isPublic: true },
        });
        break;
        
      case 'makePrivate':
        result = await prisma.song.update({
          where: { id: songId },
          data: { isPublic: false },
        });
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      message: 'Song updated successfully',
      song: result,
    });
  } catch (error) {
    console.error('Error updating song:', error);
    return NextResponse.json(
      { error: 'Failed to update song' },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    // Get the session and check if the user is an admin
    const session = await auth();
    
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const songId = searchParams.get('songId');
    
    if (!songId) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
    }
    
    // Check if the song exists
    const song = await prisma.song.findUnique({
      where: { id: songId },
    });
    
    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }
    
    // Delete the song
    await prisma.song.delete({
      where: { id: songId },
    });
    
    return NextResponse.json({
      message: 'Song deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting song:', error);
    return NextResponse.json(
      { error: 'Failed to delete song' },
      { status: 500 }
    );
  }
}
