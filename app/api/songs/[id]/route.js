import { auth } from '@/auth'
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

const prisma = new PrismaClient()

export async function GET(request, { params }) {
  try {
    // Check if user is authenticated
    const session = await auth()
    if (!session || !session.user) {
      // Redirect to login page with return URL
      return NextResponse.redirect(new URL('/login?callbackUrl=/dashboard', request.url))
    }
    
    const songId = params.id
    
    // Fetch song by ID
    const song = await prisma.song.findUnique({
      where: {
        id: songId
      },
      select: {
        id: true,
        isForSale: true,
        salePrice: true,
        isLyricsPurchased: true,
      }
    })
    
    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ song })
  } catch (error) {
    console.error('Error fetching song:', error)
    return NextResponse.json(
      { error: 'Failed to fetch song' },
      { status: 500 }
    )
  }
}

export async function PATCH(request, { params }) {
  try {
    // Check if user is authenticated
    const session = await auth()
    if (!session || !session.user) {
      // Redirect to login page with return URL
      return NextResponse.redirect(new URL('/login?callbackUrl=/dashboard', request.url))
    }
    
    const songId = params.id
    const updateData = await request.json()
    console.log("The song Updated", updateData)
    // Validate that the song belongs to the user
    const existingSong = await prisma.song.findUnique({
      where: {
        id: songId,
        userId: session.user.id
      }
    })
    
    if (!existingSong) {
      return NextResponse.json(
        { error: 'Song not found or you do not have permission to update it' },
        { status: 404 }
      )
    }
    
    // Update the song
    const updatedSong = await prisma.song.update({
      where: {
        id: songId
      },
      data: {
        ...updateData
      }
    })
    console.log("The song Updated", updatedSong)
    return NextResponse.json({ song: updatedSong })
  } catch (error) {
    console.error('Error updating song:', error)
    return NextResponse.json(
      { error: 'Failed to update song' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    // Check if user is authenticated
    const session = await auth()
    if (!session || !session.user) {
      // Redirect to login page with return URL
      return NextResponse.redirect(new URL('/login?callbackUrl=/dashboard', request.url))
    }
    
    const songId = params.id
    
    // Validate that the song belongs to the user
    const existingSong = await prisma.song.findUnique({
      where: {
        id: songId,
        userId: session.user.id
      }
    })
    
    if (!existingSong) {
      return NextResponse.json(
        { error: 'Song not found or you do not have permission to delete it' },
        { status: 404 }
      )
    }
    
    // Delete the song
    await prisma.song.delete({
      where: {
        id: songId
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting song:', error)
    return NextResponse.json(
      { error: 'Failed to delete song' },
      { status: 500 }
    )
  }
}
