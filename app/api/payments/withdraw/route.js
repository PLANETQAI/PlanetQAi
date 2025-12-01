// app/api/payments/withdraw/route.js
import { auth } from "@/auth";
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Points to dollars conversion rate (1 point = $0.01)
const POINTS_TO_DOLLARS = 0.01;
const MIN_WITHDRAWAL_AMOUNT = 100; // 100 points = $1.00

export async function POST(req) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { amount } = await req.json();
  const points = amount; // For backward compatibility with existing code
  const amountInCents = Math.round(amount * POINTS_TO_DOLLARS * 100); // Convert to cents

  try {
    // Get user's data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true,
        stripeCustomerId: true,
        stripeAccountId: true,
        email: true
      }
    });

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No payment method connected' },
        { status: 400 }
      );
    }

    if (points < MIN_WITHDRAWAL_AMOUNT) {
      return NextResponse.json(
        { error: `Minimum withdrawal is ${MIN_WITHDRAWAL_AMOUNT} points ($${(MIN_WITHDRAWAL_AMOUNT * POINTS_TO_DOLLARS).toFixed(2)})` },
        { status: 400 }
      );
    }

    // Get user's total available reward points
    const rewards = await prisma.reward.findMany({
      where: {
        userId: user.id,
        status: 'active',
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      },
      select: {
        id: true,
        points: true
      }
    });

    const totalAvailablePoints = rewards.reduce((sum, reward) => sum + reward.points, 0);

    if (totalAvailablePoints < points) {
      return NextResponse.json(
        { error: 'Insufficient reward points' },
        { status: 400 }
      );
    }

    // Create a transfer to the connected account
    const transfer = await stripe.transfers.create({
      amount: amountInCents,
      currency: 'usd',
      destination: user.stripeAccountId,
      description: `Withdrawal of ${points} points ($${(points * POINTS_TO_DOLLARS).toFixed(2)})`,
      metadata: {
        userId: session.user.id,
        points: points.toString(),
        pointsToDollars: POINTS_TO_DOLLARS.toString()
      }
    });

    // Deduct points from rewards (FIFO - First In First Out)
    let remainingPoints = points;
    const rewardUpdates = [];
    
    for (const reward of rewards.sort((a, b) => a.id.localeCompare(b.id))) {
      if (remainingPoints <= 0) break;
      
      const deduction = Math.min(reward.points, remainingPoints);
      
      if (deduction === reward.points) {
        // If using all points from this reward, update it to used
        await prisma.reward.update({
          where: { id: reward.id },
          data: { status: 'used' }
        });
      } else {
        // If using partial points, create a new reward with remaining points
        await prisma.reward.create({
          data: {
            userId: user.id,
            type: 'withdrawal_remainder',
            points: reward.points - deduction,
            description: `Remaining points after withdrawal`,
            status: 'active',
            metadata: { originalRewardId: reward.id }
          }
        });
        // Mark original reward as used
        await prisma.reward.update({
          where: { id: reward.id },
          data: { 
            points: deduction,
            status: 'used',
            description: `Used for withdrawal of ${deduction} points`
          }
        });
      }
      
      remainingPoints -= deduction;
    }

    // Record the withdrawal transaction
    await prisma.reward.create({
      data: {
        userId: session.user.id,
        type: 'withdrawal',
        points: -points, // Negative for withdrawals
        description: `Withdrawal of ${points} points ($${(points * POINTS_TO_DOLLARS).toFixed(2)})`,
        status: 'COMPLETED',
        metadata: {
          transferId: transfer.id,
          amountInCents: amountInCents,
          currency: 'usd'
        }
      },
    });

    return NextResponse.json({ 
      success: true, 
      transferId: transfer.id,
      pointsDeducted: points,
      amountInDollars: (points * POINTS_TO_DOLLARS).toFixed(2)
    });

  } catch (error) {
    console.error('Withdrawal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process withdrawal' },
      { status: error.statusCode || 500 }
    );
  }
}