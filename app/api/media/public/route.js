// app/api/media/public/route.js
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Helper function to calculate price based on credits
function calculatePrice(credits) {
  // Adjust this formula as needed for your pricing model
  return Math.ceil(credits * 0.1); // Example: $0.10 per credit
}

export async function GET() {
  try {
    const mediaItems = await prisma.media.findMany({
      where: {
        isPublic: true,
        isForSale: true,
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        },
        purchases: true
      }
    });

    const formattedMedia = mediaItems.map(media => {
      const credits = media.creditsUsed || 400; // Default to 400 if not set
      const calculatedPrice = calculatePrice(credits);
      const calculatedCredits = credits * 2.5; // Adjust multiplier as needed
      
      return {
        id: media.id,
        title: media.title,
        description: media.description,
        mediaType: media.mediaType,
        fileUrl: media.fileUrl,
        thumbnailUrl: media.thumbnailUrl,
        width: media.width,
        height: media.height,
        duration: media.duration,
        creditsUsed: credits,
        credits: calculatedCredits,
        salePrice: media.salePrice,
        price: media.salePrice ?? calculatedPrice, // Use salePrice if available, otherwise calculatedPrice
        isPublic: media.isPublic,
        tags: media.tags || [],
        createdAt: media.createdAt,
        provider: media.provider,
        quality: media.qualityStatus || 'pending',
        userId: media.userId,
        userName: media.user?.fullName,
        userEmail: media.user?.email,
        purchases: media.purchases,
        // Additional media-specific fields
        model: media.model,
        style: media.style,
        taskId: media.taskId,
        status: media.status
      };
    });

    return NextResponse.json({ media: formattedMedia });
  } catch (error) {
    console.error('Error fetching public media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}