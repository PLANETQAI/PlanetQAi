import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    // Get the session and check if the user is an admin
    const session = await auth();
    
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const search = searchParams.get('search') || '';
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build the where clause for search
    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};
    
    // Get users with pagination
    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isVerified: true,
          credits: true,
          totalCreditsUsed: true,
          createdAt: true,
          updatedAt: true,
          totalDownloads: true,
          max_download: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalUsers / limit);
    
    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    // Get the session and check if the user is an admin
    const session = await auth();
    
    if (!session || session.user.role !== 'Admin') {
      console.log(session.user.role);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await req.json();
    const { userId, action, ...data } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    let result;

    // Handle different actions
    // Allow credit additions for any user, but restrict other modifications on fellow admins.
    if (action !== 'addCredits' && user.role === 'Admin' && user.id !== session.user.id) {
      return NextResponse.json(
        { error: `Cannot perform '${action}' on another admin user` },
        { status: 403 }
      );
    }
    
    // Handle different actions
    switch (action) {
      case 'verify':
        result = await prisma.user.update({
          where: { id: userId },
          data: { isVerified: true },
        });
        break;
        
      case 'suspend':
        // For suspension, we don't actually delete the user, just mark them
        result = await prisma.user.update({
          where: { id: userId },
          data: { isSuspended: true },
        });
        break;
        
      case 'addCredits':
        const creditsToAdd = data.credits || 50; // Default to 50 if not specified
        result = await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { 
              credits: { increment: creditsToAdd } 
            },
          }),
          prisma.creditLog.create({
            data: {
              userId,
              amount: creditsToAdd,
              balanceAfter: user.credits + creditsToAdd,
              description: 'Credits added by admin',
            },
          }),
        ]);
        break;
        
      case 'changeRole':
        if (!data.role) {
          return NextResponse.json(
            { error: 'Role is required for changeRole action' },
            { status: 400 }
          );
        }
        
        result = await prisma.user.update({
          where: { id: userId },
          data: { role: data.role },
        });
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      message: 'User updated successfully',
      user: result,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    // Get the session and check if the user is an admin
    const session = await auth();
    
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Prevent deleting admin users
    if (user.role === 'Admin') {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 403 }
      );
    }
    
    // Delete the user
    await prisma.user.delete({
      where: { id: userId },
    });
    
    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
