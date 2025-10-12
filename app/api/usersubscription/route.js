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
  // Start a transaction to ensure data consistency
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

    // 3. Check for existing active subscription
    const existingSubscription = await tx.userSubscription.findFirst({
      where: {
        userId,
        isActive: true,
        expiryDate: { gt: new Date() }
      }
    });

    if (existingSubscription) {
      throw new Error('User already has an active subscription');
    }

    // 4. Define subscription cost
    const subscriptionCost = 160; // or plan.creditsRequired if defined in the plan

    // 5. Log credit check details
    console.log(`Subscription credit check for user ${user.email} (${user.id}):`);
    console.log(`- Available credits: ${user.creditsRemaining || 0}`);
    console.log(`- Required credits: ${subscriptionCost}`);
    console.log(`- Has enough credits: ${user.creditsRemaining >= subscriptionCost ? 'YES' : 'NO'}`);

    // 6. Check if user has enough creditsß
    if (user.credits < subscriptionCost) {
      throw new Error(`Insufficient credits: needed ${subscriptionCost}, have ${user.credits}`);
    }

    // 7. Calculate expiry date
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(now.getDate() + (plan.durationDays || 30));

    // 8. Create subscription and update user credits in a single transaction
    const [subscription] = await Promise.all([
      tx.userSubscription.create({
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
      }),
      tx.user.update({
        where: { id: userId },
        data: {
          creditsRemaining: { decrement: subscriptionCost },
          credits: { decrement: subscriptionCost },
          totalCreditsUsed: { increment: subscriptionCost }
        }
      })
    ]);

    // 9. Log successful subscription
    console.log(`Subscription created successfully for user ${user.email}:`);
    console.log(`- Plan: ${subscription.plan.name}`);
    console.log(`- Credits deducted: ${subscriptionCost}`);
    console.log(`- New credit balance: ${user.creditsRemaining - subscriptionCost}`);

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
