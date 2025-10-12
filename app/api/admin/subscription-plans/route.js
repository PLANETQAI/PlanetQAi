import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Get all subscription plans with pagination and search
export async function GET(req) {
  try {
    // Check if user is admin
    const session = await auth();
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build the where clause for search
    const where = search
      ? {
          name: { contains: search, mode: 'insensitive' }
        }
      : {};

    // Get plans with pagination and subscriber count
    const [plans, totalPlans] = await Promise.all([
      prisma.userSubscriptionPlan.findMany({
        where,
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
        orderBy: { durationDays: 'asc' },
        skip,
        take: limit,
      }),
      prisma.userSubscriptionPlan.count({ where })
    ]);

    // Format the response
    const formattedPlans = plans.map(plan => ({
      ...plan,
      subscriberCount: plan._count?.subscriptions?.length || 0,
      _count: undefined // Remove the _count field
    }));

    return NextResponse.json({
      success: true,
      data: formattedPlans,
      pagination: {
        total: totalPlans,
        page,
        limit,
        totalPages: Math.ceil(totalPlans / limit)
      }
    });

  } catch (error) {
    console.error('Failed to fetch subscription plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}

// Create a new subscription plan (Admin only)
export async function POST(req) {
  try {
    // Check if user is admin
    const session = await auth();
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, features, durationDays } = await req.json();
    
    // Validate required fields
    if (!name || !Array.isArray(features) || !durationDays) {
      return NextResponse.json(
        { error: 'Name, features, and durationDays are required' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');
    
    // Create the plan
    const plan = await prisma.userSubscriptionPlan.create({
      data: {
        name:slug,
        features: { set: features },
        durationDays: parseInt(durationDays, 10),
        isActive: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: plan 
    });

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
    // Check if user is admin
    const session = await auth();
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ...updateData } = await req.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Prevent slug updates through the API
    if (updateData.slug) {
      delete updateData.slug;
    }

    // Update the plan
    const updatedPlan = await prisma.userSubscriptionPlan.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ 
      success: true, 
      data: updatedPlan 
    });

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

// Delete a subscription plan (Admin only)
export async function DELETE(req) {
  try {
    // Check if user is admin
    const session = await auth();
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get ID from query parameters
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
