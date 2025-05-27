import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req) {
  try {
    // Get the session and check if the user is an admin
    const session = await auth();
    
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get dashboard stats
    const [totalUsers, totalSongs, totalCreditsUsed, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.song.count(),
      prisma.user.aggregate({
        _sum: {
          totalCreditsUsed: true,
        },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          fullName: true,
          email: true,
          createdAt: true,
          credits: true,
          isVerified: true,
          role: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalSongs,
      totalCreditsUsed: totalCreditsUsed._sum.totalCreditsUsed || 0,
      recentUsers,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
