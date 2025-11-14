import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get total counts and sizes
    const [
      totalMedia,
      totalVideos,
      totalImages,
      videoSizeResult,
      imageSizeResult
    ] = await Promise.all([
      prisma.media.count(),
      prisma.media.count({ where: { mediaType: 'video' } }),
      prisma.media.count({ where: { mediaType: 'image' } }),
      prisma.media.aggregate({
        where: { mediaType: 'video' },
        _sum: { fileSize: true },
      }),
      prisma.media.aggregate({
        where: { mediaType: 'image' },
        _sum: { fileSize: true },
      }),
    ]);

    const videoSize = videoSizeResult._sum.fileSize || 0;
    const imageSize = imageSizeResult._sum.fileSize || 0;
    const totalSize = videoSize + imageSize;

    return NextResponse.json({
      totalMedia,
      totalVideos,
      totalImages,
      totalSize,
      videoSize,
      imageSize,
    });
  } catch (error) {
    console.error('Error fetching media stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media statistics' },
      { status: 500 }
    );
  }
}

// Add CORS headers for API routes
export function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
