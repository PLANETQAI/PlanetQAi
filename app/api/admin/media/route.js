import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';



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

    // Build the where clause - no user filtering
    const where = {};
    
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

    // Transform the response
    const transformedMedia = media.map(item => {
      const { user: originalUser, ...restOfItem } = item;
      
      return {
        ...restOfItem,
        user: {
          id: originalUser?.id || null,
          name: originalUser?.fullName || 'Unknown User',
          email: originalUser?.email || null
        }
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
