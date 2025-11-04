import { auth } from "@/auth";
import prisma from '@/lib/prisma';
import NextResponse from 'next/server';

// GET /api/media/video/[id] - Get a specific video
export async function GET(request, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const video = await prisma.media.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
        mediaType: 'video'
      }
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return NextResponse.json(video)

  } catch (error) {
    console.error('Error fetching video:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 }
    )
  }
}

// PATCH /api/media/video/[id] - Update video details
export async function PATCH(request, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, isPublic, tags } = await request.json()

    const video = await prisma.media.update({
      where: {
        id: params.id,
        userId: session.user.id,
        mediaType: 'video'
      },
      data: {
        title,
        description,
        isPublic,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined
      }
    })

    return NextResponse.json(video)

  } catch (error) {
    console.error('Error updating video:', error)
    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    )
  }
}

// DELETE /api/media/video/[id] - Delete a video
export async function DELETE(request, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First, verify the video exists and belongs to the user
    const video = await prisma.media.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
        mediaType: 'video'
      }
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Delete associated records first (if any)
    await prisma.mediaOnShares.deleteMany({
      where: { mediaId: params.id }
    })

    await prisma.mediaPurchase.deleteMany({
      where: { mediaId: params.id }
    })

    // Delete the video
    await prisma.media.delete({
      where: { id: params.id }
    })

    // TODO: Add logic to delete the actual video file from storage

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    )
  }
}