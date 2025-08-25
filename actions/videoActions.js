// app/actions/videoActions.js
'use server'
import prisma from '@/lib/prisma'

export async function getVideos() {
  try {
    const videos = await prisma.videoLinks.findMany({
      include: {
        User: {
          select: {
            id: true,
            role: true,
            fullName: true,
            email: true,
          },
        },
      },
    })
    return videos
  } catch (error) {
    console.error('Error fetch videos:', error)
    return []
  }
}