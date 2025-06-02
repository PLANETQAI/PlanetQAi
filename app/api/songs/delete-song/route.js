import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Route segment config
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Use POST method instead of DELETE since DELETE with bodies can be problematic
export async function POST(request) {
  try {
    // Authenticate the user
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the audioUrl from the request body
    const { audioUrl } = await request.json()
    
    console.log('Received delete request for audioUrl:', audioUrl)
    
    if (!audioUrl) {
      return NextResponse.json({ error: 'Audio URL is required' }, { status: 400 })
    }

    // Find the song by audioUrl
    const song = await prisma.song.findFirst({
      where: {
        audioUrl: audioUrl,
        userId: session.user.id // Ensure the song belongs to the user
      }
    })

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }

    // Delete the song
    await prisma.song.delete({
      where: {
        id: song.id
      }
    })

    // Also delete from gallery if it exists there
    try {
      await prisma.gallery.deleteMany({
        where: {
          audioLink: audioUrl,
          userId: session.user.id
        }
      })
    } catch (galleryError) {
      console.error('Error deleting from gallery:', galleryError)
      // Continue even if gallery deletion fails
    }

    return NextResponse.json({ 
      message: 'Song deleted successfully',
      songId: song.id
    }, { status: 200 })
  } catch (error) {
    console.error('Error deleting song by audio URL:', error)
    return NextResponse.json({ error: 'Failed to delete song' }, { status: 500 })
  }
}
