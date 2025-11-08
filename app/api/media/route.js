import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, mediaType, aspectRatio, outputFormat } = await request.json();

    if (!title || !mediaType) {
      return NextResponse.json(
        { error: 'Title and mediaType are required' },
        { status: 400 }
      );
    }

    // Create the media record
    const media = await prisma.media.create({
      data: {
        title,
        description,
        mediaType,
        status: 'pending',
        userId: session.user.id,
        width: aspectRatio === '16:9' ? 1920 : 1024,
        height: aspectRatio === '16:9' ? 1080 : 1024,
        mimeType: `image/${outputFormat || 'png'}`,
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(media);
  } catch (error) {
    console.error('Error creating media:', error);
    return NextResponse.json(
      { error: 'Failed to create media record' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'image', 'video', or undefined for all
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get IDs of all media purchased by the user first
    const purchasedMediaIds = await prisma.songPurchase.findMany({
        where: {
            userId: session.user.id,
            mediaId: { not: null },
        },
        select: {
            mediaId: true,
        },
    }).then(purchases => new Set(purchases.map(p => p.mediaId)));

    // Build the where clause
    const where = {
      OR: [
        // User's own media
        { userId: session.user.id },
        // Media shared with the user
        {
          shares: {
            some: {
              share: {
                sharedWith: {
                  some: {
                    userId: session.user.id
                  }
                }
              }
            }
          }
        },
        // Purchased media
        {
          id: {
            in: Array.from(purchasedMediaIds).filter(Boolean)
          }
        }
      ]
    };

    // Add media type filter if specified
    if (type) {
      where.mediaType = type;
    }

    // Get paginated media
    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          shares: {
            include: {
              share: {
                include: {
                  sharedWith: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          fullName: true,
                          email: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.media.count({ where })
    ]);

    // Transform the response to include shared and purchase info
    const transformedMedia = media.map(item => {
      const isOwner = item.userId === session.user.id;
      const isPurchased = purchasedMediaIds.has(item.id); // Corrected check

      const sharedWith = item.shares.flatMap(share => 
        share.share.sharedWith
          .filter(u => u.userId !== session.user.id)
          .map(u => ({
            id: u.user.id,
            name: u.user.fullName,
            email: u.user.email
          }))
      );

      const { user: originalUser, ...restOfItem } = item;

      return {
        ...restOfItem,
        isOwner,
        isPurchased,
        sharedWith,
        user: {
          id: originalUser.id,
          name: originalUser.fullName,
          ...(isOwner && { email: originalUser.email })
        },
      };
    });

    return NextResponse.json({
      data: transformedMedia,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

// Add CORS headers for API routes
export function OPTIONS() {
  const response = new NextResponse(null, {
    status: 204,
  });
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}
