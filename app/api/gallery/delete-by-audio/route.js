import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Route segment config
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST endpoint for deleting gallery items by audioLink
export async function POST(request) {
  try {
    // Authenticate the user
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the audioUrl from the request body
    const { audioUrl } = await request.json()
    
    console.log('Received gallery delete request for audioUrl:', audioUrl)
    
    if (!audioUrl) {
      return NextResponse.json({ error: 'Audio URL is required' }, { status: 400 })
    }

    // Delete all gallery items with the matching audioLink for this user
    const result = await prisma.gallery.deleteMany({
      where: {
        audioLink: audioUrl,
        userId: session.user.id // Ensure the gallery items belong to the user
      }
    })

    console.log(`Deleted ${result.count} gallery items with audioLink: ${audioUrl}`)

    return NextResponse.json({ 
      message: 'Gallery items deleted successfully',
      count: result.count
    }, { status: 200 })
  } catch (error) {
    console.error('Error deleting gallery items by audioLink:', error)
    return NextResponse.json({ error: 'Failed to delete gallery items' }, { status: 500 })
  }
}
