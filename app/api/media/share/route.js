// app/api/share/route.js
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { mediaIds, sharedById } = await request.json();

    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return NextResponse.json(
        { error: 'Media IDs are required' },
        { status: 400 }
      );
    }

    // Create a share record
    const share = await prisma.mediaonshares.create({
      data: {
        sharedById,
        media: {
          connect: mediaIds.map(id => ({ id }))
        }
      },
      include: {
        media: true
      }
    });

    return NextResponse.json({
      media: share.media
    });

  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { shareId } = params;

    const share = await prisma.mediaonshares.findUnique({
      where: {
        shareId: shareId,
      },
      include: {
        media: true
      }
    });

    if (!share) {
      return NextResponse.json(
        { error: 'Share link not found or expired' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      media: share.media
    });

  } catch (error) {
    console.error('Error fetching shared media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared media' },
      { status: 500 }
    );
  }
}