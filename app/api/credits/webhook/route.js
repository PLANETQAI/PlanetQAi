import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();

// Initialize Stripe with the secret key if available
let stripe;
try {
  const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;
  if (stripeKey) {
    stripe = new Stripe(stripeKey);
  }
} catch (error) {
  console.error('Failed to initialize Stripe:', error.message);
}

// This is your Stripe webhook secret for testing your endpoint locally
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;

  try {
    // Verify the event came from Stripe
    event = await stripe.webhooks.constructEventAsync(payload, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    
    // Make sure this is a credit purchase
    if (session.metadata?.type === "credit_purchase") {
      try {
        // Extract metadata
        const userId = session.metadata.userId;
        const packageId = session.metadata.packageId;
        const creditsToAdd = parseInt(session.metadata.credits, 10);
        const packageName = session.metadata.packageName;
        
        if (!userId || !creditsToAdd) {
          throw new Error("Missing required metadata");
        }

        // Get current user credits
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { credits: true },
        });

        if (!user) {
          throw new Error(`User not found: ${userId}`);
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
            balanceBefore: user.credits,
            balanceAfter: updatedUser.credits,
            description: `Purchased ${packageName} (${creditsToAdd} credits)`,
            transactionId: session.id,
          },
        });

        console.log(`Credits added successfully: ${creditsToAdd} for user ${userId}`);
      } catch (error) {
        console.error(`Error processing credit purchase: ${error.message}`);
        return NextResponse.json(
          { error: `Error processing credit purchase: ${error.message}` },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}

// Disable body parsing, we need the raw body for signature verification
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// This tells Next.js to not parse the body
export const preferredRegion = 'auto';
