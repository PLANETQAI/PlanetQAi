import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Middleware to check if user is admin
async function requireAdmin(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  return user?.role === 'ADMIN';
}

// Create a new subscription plan (Admin only)
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { name, features, durationDays } = await req.json();
    
    if (!name || !Array.isArray(features) || !durationDays) {
      return NextResponse.json(
        { error: 'Name, features, and durationDays are required' },
        { status: 400 }
      );
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    
    const plan = await prisma.userSubscriptionPlan.create({
      data: {
        name:slug,
        features: {
          set: features
        },
        durationDays: parseInt(durationDays, 10),
        isActive: true
      }
    });

    return NextResponse.json({ success: true, data: plan });

  } catch (error) {
    console.error('Failed to create subscription plan:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A plan with this name already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription plan' },
      { status: 500 }
    );
  }
}

// Update a subscription plan (Admin only)
export async function PUT(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { id, ...updateData } = await req.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    if (updateData.slug) {
      delete updateData.slug;
    }

    const updatedPlan = await prisma.userSubscriptionPlan.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, data: updatedPlan });

  } catch (error) {
    console.error('Failed to update subscription plan:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update subscription plan' },
      { status: 500 }
    );
  }
}

// Get all subscription plans (for Admin)
export async function GET(req) {
  try {
    // This endpoint is now admin-only as it includes subscriber counts
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const isDebug = searchParams.get('raw_debug') === 'true';

    // --- TEMPORARY DEBUGGING FEATURE ---
    if (isDebug) {
      const rawSubscriptions = await prisma.userSubscription.findMany({});
      return NextResponse.json({ 
        message: "Debug mode: Returning all entries from the UserSubscription table.",
        count: rawSubscriptions.length,
        data: rawSubscriptions
      });
    }
    // --- END DEBUGGING FEATURE ---

    const plans = await prisma.userSubscriptionPlan.findMany({
      select: {
        id: true,
        name: true,
        features: true,
        durationDays: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { 
            subscriptions: {
              where: {
                isActive: true,
                expiryDate: { gt: new Date() }
              }
            }
          }
        }
      },
      orderBy: {
        durationDays: 'asc'
      }
    });

    // Remap the data to be more frontend-friendly
    const formattedPlans = plans.map(plan => ({
      ...plan,
      subscriberCount: plan._count.subscriptions
    }));

    return NextResponse.json({ success: true, data: formattedPlans });

  } catch (error) {
    console.error('Failed to fetch subscription plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}

// Delete a subscription plan (Admin only)
export async function DELETE(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Soft delete by marking as inactive
    const plan = await prisma.userSubscriptionPlan.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription plan deactivated',
      data: plan
    });

  } catch (error) {
    console.error('Failed to delete subscription plan:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to delete subscription plan' },
      { status: 500 }
    );
  }
}
