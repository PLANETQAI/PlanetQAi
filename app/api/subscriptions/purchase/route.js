// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

// Initialize Stripe with the correct secret key
let stripe;
try {
  // Use the main Stripe secret key - the STRIPE_SUBSCRIPTION_SECRET_KEY appears to be a webhook secret
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  console.log('Using Stripe key:', stripeKey ? 'Key available' : 'No key available');
  
  if (stripeKey) {
    stripe = new Stripe(stripeKey);
    console.log('Stripe initialized successfully');
  } else {
    console.warn('No Stripe key available, will use fallback mode');
  }
} catch (error) {
  console.error('Failed to initialize Stripe for subscriptions:', error.message);
}

const prisma = new PrismaClient();

// Define subscription plans with credit amounts
const SUBSCRIPTION_PLANS = [
  {
    id: "starter-plan",
    title: "Starter Plan",
    description: "Great for Beginners",
    price: 10,
    credits: 20000,
    songs: 250,
    packageId: "prod_SQkSzKD1bvmB7e"
  },
  {
    id: "pro-plan",
    title: "Pro Plan",
    description: "For Serious Creators",
    price: 20,
    credits: 40000,
    songs: 500,
    packageId: "prod_SQkSDQBT6vs18R"
  },
  {
    id: "premium-plan",
    title: "Premium Plan",
    description: "Studio-Level Access",
    price: 30,
    credits: 80000,
    songs: 1000,
    packageId: "prod_SQkSPecauChp8L"
  }
];

// GET handler to retrieve available subscription plans
export async function GET(req) {
  try {
    // Get user session
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return available subscription plans
    return NextResponse.json({
      success: true,
      plans: SUBSCRIPTION_PLANS,
    });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription plans" },
      { status: 500 }
    );
  }
}

// POST handler to process subscription purchase
export async function POST(req) {
  console.log('Subscription purchase API called');
  
  try {
    // Get user session
    const session = await auth();
    console.log('Auth session result:', session ? 'Session found' : 'No session');
    
    if (!session) {
      console.log('Unauthorized: No session found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('User ID from session:', userId);
    
    const body = await req.json();
    console.log('Request body:', body);
    
    const { planId } = body;

    // Validate plan ID
    console.log('Looking for plan with ID:', planId);
    console.log('Available plans:', SUBSCRIPTION_PLANS);
    
    const selectedPlan = SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
    if (!selectedPlan) {
      console.log('Invalid plan selected:', planId);
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }
    
    console.log('Selected plan:', selectedPlan);

    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, credits: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create metadata for the purchase
    const metadata = {
      userId: user.id,
      planId: selectedPlan.id,
      credits: selectedPlan.credits.toString(),
      planName: selectedPlan.title,
      type: 'subscription_purchase'
    };

    // Check if Stripe is initialized
    if (!stripe) {
      // If Stripe is not available, fall back to directly adding credits (for testing/development)
      console.log('Stripe not initialized, falling back to direct credit addition');
      
      // Add credits to user account
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          credits: user.credits + selectedPlan.credits,
          subscription: {
            planId: selectedPlan.id,
            planName: selectedPlan.title,
            credits: selectedPlan.credits,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            status: 'Active'
          }
        },
      });

      // Create a credit log entry
      await prisma.creditLog.create({
        data: {
          userId,
          amount: selectedPlan.credits,
          balanceBefore: user.credits,
          balanceAfter: updatedUser.credits,
          description: `Subscribed to ${selectedPlan.title} (${selectedPlan.credits} credits)`,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Subscription activated successfully (Stripe bypass mode)",
        newBalance: updatedUser.credits,
      });
    }
    
    // Create a Stripe checkout session
    console.log('Creating Stripe checkout session for subscription');
    try {
      const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: selectedPlan.title,
                description: `${selectedPlan.credits} credits (${selectedPlan.songs} songs) per month`,
              },
              unit_amount: selectedPlan.price * 100, // Stripe uses cents
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.NEXTAUTH_URL || 'https://www.planetqradio.com'}/payment?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL || 'https://www.planetqradio.com'}/payment?canceled=true`,
        customer_email: user.email,
        metadata: metadata,
      });
      
      console.log('Stripe session created successfully:', stripeSession.id);
      console.log('Checkout URL:', stripeSession.url);

      // Return the Stripe checkout URL
      return NextResponse.json({
        success: true,
        url: stripeSession.url,
        sessionId: stripeSession.id
      });
    } catch (stripeError) {
      console.error('Stripe checkout session creation failed:', stripeError.message);
      return NextResponse.json(
        { error: "Failed to create Stripe checkout session", details: stripeError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Subscription purchase error:", error.message);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: "Failed to process subscription purchase", details: error.message },
      { status: 500 }
    );
  }
}
