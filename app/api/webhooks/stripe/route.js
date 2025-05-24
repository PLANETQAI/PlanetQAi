import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        // Extract metadata
        const userId = session.metadata.userId;
        const packageId = session.metadata.packageId;
        const creditsToAdd = parseInt(session.metadata.credits, 10);
        
        if (!userId || !creditsToAdd) {
          console.error('Missing required metadata in Stripe session');
          return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
        }
        
        // Get current user credits
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { credits: true },
        });
        
        if (!user) {
          console.error(`User not found: ${userId}`);
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        // Add credits to user account
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            credits: user.credits + creditsToAdd,
          },
        });
        
        // Create a credit log entry
        await prisma.creditLog.create({
          data: {
            userId,
            amount: creditsToAdd,
            balanceAfter: updatedUser.credits,
            description: `Purchased ${creditsToAdd} credits (Stripe payment)`,
            relatedEntityId: session.id,
            relatedEntityType: 'stripe_session',
          },
        });
        
        console.log(`Added ${creditsToAdd} credits to user ${userId}`);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
