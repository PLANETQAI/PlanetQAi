import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Check user subscription status
async function checkUserSubscription(userId) {
  const now = new Date();
  
  const activeSubscription = await prisma.userSubscription.findFirst({
    where: {
      userId,
      isActive: true,
      expiryDate: { gt: now }
    },
    include: {
      plan: {
        select: {
          id: true,
          name: true,
          features: true,
          durationDays: true,
          isActive: true
        }
      }
    },
    orderBy: {
      expiryDate: 'desc'
    }
  });

  return {
    hasActiveSubscription: !!activeSubscription,
    subscription: activeSubscription ? {
      id: activeSubscription.id,
      name: activeSubscription.plan.name,
      features: activeSubscription.plan.features || [],
      durationDays: activeSubscription.plan.durationDays,
      startDate: activeSubscription.startDate,
      expiryDate: activeSubscription.expiryDate,
      status: 'ACTIVE',
      planId: activeSubscription.planId
    } : null
  };
}

// Create a new user subscription
async function createUserSubscription(userId, planId) {
  return await prisma.$transaction(async (tx) => {
    // 1. Get the user with current credits
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        email: true,
        credits: true,
        creditsRemaining: true 
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 2. Get the plan and verify it exists and is active
    const plan = await tx.userSubscriptionPlan.findUnique({
      where: { 
        id: planId,
        isActive: true 
      }
    });

    if (!plan) {
      throw new Error('Subscription plan not found or inactive');
    }

    const now = new Date();
    
    // 3. Check for any existing subscription (active or expired)
    const existingSubscription = await tx.userSubscription.findFirst({
      where: {
        userId,
        planId
      },
      orderBy: {
        expiryDate: 'desc'
      }
    });

    // 4. Handle existing subscription
    if (existingSubscription) {
      // If there's an active subscription, throw error
      if (existingSubscription.isActive && new Date(existingSubscription.expiryDate) > now) {
        throw new Error('You already have an active subscription for this plan');
      }
      
      // If there's an expired subscription, update it instead of creating new
      if (!existingSubscription.isActive || new Date(existingSubscription.expiryDate) <= now) {
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1); // Add 1 month from now

        const updatedSubscription = await tx.userSubscription.update({
          where: { id: existingSubscription.id },
          data: {
            isActive: true,
            startDate: now,
            expiryDate,
            updatedAt: now
          },
          include: {
            plan: {
              select: {
                name: true,
                features: true,
                durationDays: true
              }
            }
          }
        });

        return {
          id: updatedSubscription.id,
          name: updatedSubscription.plan.name,
          features: updatedSubscription.plan.features,
          durationDays: updatedSubscription.plan.durationDays,
          startDate: updatedSubscription.startDate,
          expiryDate: updatedSubscription.expiryDate,
          status: 'RENEWED',
          creditsDeducted: 0,
          remainingCredits: user.creditsRemaining
        };
      }
    }

    // 5. If no existing subscription, proceed with new subscription
    const subscriptionCost = 160; // or plan.creditsRequired if defined in the plan

    // 6. Check if user has enough credits
    if (user.credits < subscriptionCost) {
      throw new Error(`Insufficient credits: needed ${subscriptionCost}, have ${user.credits}`);
    }

    // 7. Calculate expiry date (1 month from now)
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    // 8. Create new subscription
    const subscription = await tx.userSubscription.create({
      data: {
        userId,
        planId,
        startDate: now,
        expiryDate,
        isActive: true,
      },
      include: {
        plan: {
          select: {
            name: true,
            features: true,
            durationDays: true
          }
        }
      }
    });

    // 9. Update user credits
    await tx.user.update({
      where: { id: userId },
      data: {
        creditsRemaining: { decrement: subscriptionCost },
        credits: { decrement: subscriptionCost },
        totalCreditsUsed: { increment: subscriptionCost }
      }
    });

    return {
      id: subscription.id,
      name: subscription.plan.name,
      features: subscription.plan.features,
      durationDays: subscription.plan.durationDays,
      startDate: subscription.startDate,
      expiryDate: subscription.expiryDate,
      status: 'ACTIVE',
      creditsDeducted: subscriptionCost,
      remainingCredits: user.creditsRemaining - subscriptionCost
    };
  });
}

// Cancel user subscription
async function cancelUserSubscription(userId, subscriptionId) {
  return await prisma.$transaction(async (tx) => {
    // 1. Find and validate subscription
    const subscription = await tx.userSubscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
        isActive: true,
        expiryDate: { gt: new Date() }
      }
    });

    if (!subscription) {
      throw new Error('Active subscription not found');
    }

    // 2. Calculate and refund remaining days (pro-rated)
    const now = new Date();
    const totalDays = (subscription.expiryDate - subscription.startDate) / (1000 * 60 * 60 * 24);
    const remainingDays = (subscription.expiryDate - now) / (1000 * 60 * 60 * 24);
    const daysUsed = totalDays - remainingDays;
    
    // Refund 50% of remaining days (adjust as needed)
    const refundAmount = Math.floor((160 * remainingDays) / totalDays * 0.5);

    // 3. Update subscription and user credits
    await Promise.all([
      tx.userSubscription.update({
        where: { id: subscriptionId },
        data: { 
          isActive: false,
          expiryDate: now
        }
      }),
      tx.user.update({
        where: { id: userId },
        data: {
          creditsRemaining: { increment: refundAmount },
          // Optionally track refunds separately
        }
      })
    ]);

    return { 
      success: true,
      refundAmount,
      cancelledAt: now
    };
  });
}

// Get all active subscription plans
async function getSubscriptionPlans() {
  return await prisma.userSubscriptionPlan.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      features: true,
      durationDays: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: {
      durationDays: 'asc'
    }
  });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    // Get subscription plans (public endpoint)
    if (type === 'plans') {
      const plans = await getSubscriptionPlans();
      return NextResponse.json({ plans });
    }

    // Get user subscription status (requires auth)
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const subscription = await checkUserSubscription(session.user.id);
    return NextResponse.json(subscription);

  } catch (error) {
    console.error('Subscription check failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { planId } = await req.json();
    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    const subscription = await createUserSubscription(session.user.id, planId);
    return NextResponse.json({ success: true, data: subscription });

  } catch (error) {
    console.error('Subscription creation failed:', error);
    const status = error.message.includes('not found') ? 404 : 400;
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status }
    );
  }
}

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
    const subscriptionId = searchParams.get('id');
    
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    const result = await cancelUserSubscription(session.user.id, subscriptionId);
    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error('Subscription cancellation failed:', error);
    const status = error.message.includes('not found') ? 404 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status }
    );
  }
}
