import { auth } from '@/auth'
import prisma from '@/lib/prisma'

// Route segment config
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function DELETE(request) {
  try {
    // Authenticate the user
    const session = await auth()
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get the audioUrl from the request body
    const { audioUrl } = await request.json()
    
    if (!audioUrl) {
      return new Response(JSON.stringify({ error: 'Audio URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Find the song by audioUrl
    const song = await prisma.song.findFirst({
      where: {
        audioUrl: audioUrl,
        userId: session.user.id // Ensure the song belongs to the user
      }
    })

    if (!song) {
      return new Response(JSON.stringify({ error: 'Song not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
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

    return new Response(JSON.stringify({ 
      message: 'Song deleted successfully',
      songId: song.id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error deleting song by audio URL:', error)
    return new Response(JSON.stringify({ error: 'Failed to delete song' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
