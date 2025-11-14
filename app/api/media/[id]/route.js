import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const mediaId = params.id;
    
    // Check if ID exists
    if (!mediaId) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      );
    }

    // Find the media to check ownership
    const media = await prisma.media.findUnique({
      where: { id: mediaId }
    });

    // Check if media exists
    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    // Verify ownership (only the creator can delete)
    if (media.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this media' },
        { status: 403 }
      );
    }

    // Log file URLs that would be deleted in a real implementation
    if (media.fileUrl) {
      console.log('Media file URL to delete (in production):', media.fileUrl);
    }
    if (media.thumbnailUrl) {
      console.log('Thumbnail URL to delete (in production):', media.thumbnailUrl);
    }

    // Delete the media record (related MediaOnShares will be deleted automatically due to onDelete: Cascade)
    await prisma.media.delete({
      where: { id: mediaId }
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Media deleted successfully',
        mediaId
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json(
      { error: 'Failed to delete media', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/media/[id] - Update media details including sale status
export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const mediaId = params.id;
    const { isForSale, salePrice, isPublic } = await request.json();
    
    // Check if ID exists
    if (!mediaId) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      );
    }

    // Find the media to check ownership
    const media = await prisma.media.findUnique({
      where: { id: mediaId }
    });

    // Check if media exists
    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    // Verify ownership (only the creator can update)
    if (media.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this media' },
        { status: 403 }
      );
    }

    // Update the media
    const updatedMedia = await prisma.media.update({
      where: { id: mediaId },
      data: {
        isForSale: isForSale !== undefined ? isForSale : media.isForSale,
        salePrice: salePrice !== undefined ? parseFloat(salePrice) : media.salePrice,
        isPublic: isPublic !== undefined ? isPublic : media.isPublic,
      },
      select: {
        id: true,
        title: true,
        isForSale: true,
        salePrice: true,
        isPublic: true,
        fileUrl: true,
        thumbnailUrl: true,
        mediaType: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Media updated successfully',
      media: updatedMedia
    });
    
  } catch (error) {
    console.error('Error updating media:', error);
    return NextResponse.json(
      { error: 'Failed to update media', details: error.message },
      { status: 500 }
    );
  }
}

// Add OPTIONS method for CORS preflight
// This is important for DELETE and PATCH requests from the browser
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
