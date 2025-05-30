import { auth } from '@/auth'
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

const prisma = new PrismaClient()

export async function GET(request) {
  try {
    // Check if user is authenticated
    const session = await auth()
    if (!session || !session.user) {
      // Redirect to login page with return URL
      return NextResponse.redirect(new URL('/login?callbackUrl=/dashboard', request.url))
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Only filter by user ID, let the frontend handle provider filtering
    const filters = {
      userId: session.user.id
    }
    
    console.log('Fetching all songs for user:', session.user.id)
    
    // Fetch songs with pagination
    const songs = await prisma.song.findMany({
      where: filters,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })
    
    console.log(`Found ${songs.length} songs matching the filters`)
    
    // Get total count for pagination
    const totalCount = await prisma.song.count({
      where: filters
    })
    
    return NextResponse.json({
      songs,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + songs.length < totalCount
      }
    })
  } catch (error) {
    console.error('Error fetching songs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch songs' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    // Check if user is authenticated
    const session = await auth()
    if (!session || !session.user) {
      // Redirect to login page with return URL
      return NextResponse.redirect(new URL('/login?callbackUrl=/dashboard', request.url))
    }
    
    // Get song data from request body
    const songData = await request.json()
    
    // Validate required fields
    if (!songData.title || !songData.audioUrl || !songData.generator) {
      return NextResponse.json(
        { error: 'Missing required fields: title, audioUrl, and generator are required' },
        { status: 400 }
      )
    }
    
    // Create the song
    const song = await prisma.song.create({
      data: {
        userId: session.user.id,
        title: songData.title,
        audioUrl: songData.audioUrl,
        lyrics: songData.lyrics || null,
        thumbnailUrl: songData.coverImageUrl || null,
        duration: songData.duration || 0,
        provider: songData.generator || null,
        prompt: songData.prompt || null,
        style: songData.style || null,
        tempo: songData.tempo || null,
        mood: songData.mood || null,
        creditsUsed: 0, // Default value
        isPublic: false // Default value
      }
    })
    
    return NextResponse.json({ song }, { status: 201 })
  } catch (error) {
    console.error('Error saving song:', error)
    return NextResponse.json(
      { error: 'Failed to save song' },
      { status: 500 }
    )
  }
}
