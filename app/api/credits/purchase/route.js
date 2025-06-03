import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

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

const prisma = new PrismaClient();

// Define credit packages
const CREDIT_PACKAGES = [
  { id: "prod_SQkShxszzVfSea", name: "Small Pack", credits: 100, price: 5 },
  { id: "prod_SQkSMOMbFVZIqD", name: "Medium Pack", credits: 300, price: 12 },
  { id: "prod_SQkSemW9YYNuto", name: "Large Pack", credits: 700, price: 25 },
  { id: "prod_SQkSmmaeLkOgSY", name: "Extra Large Pack", credits: 1500, price: 45 },
];

// Define subscription plans
const SUBSCRIPTION_PLANS = [
  { id: "prod_SQkSzKD1bvmB7e", name: "Starter Plan", credits: 20000, price: 10, isSubscription: true },
  { id: "prod_SQkSDQBT6vs18R", name: "Pro Plan", credits: 40000, price: 20, isSubscription: true },
  { id: "prod_SQkSPecauChp8L", name: "Premium Plan", credits: 80000, price: 30, isSubscription: true },
];

// Combined packages for lookup
const ALL_PACKAGES = [...CREDIT_PACKAGES, ...SUBSCRIPTION_PLANS];

// GET handler to retrieve available credit packages
export async function GET(req) {
  try {
    // Get user session
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return available credit packages and subscription plans
    return NextResponse.json({
      success: true,
      packages: CREDIT_PACKAGES,
      subscriptionPlans: SUBSCRIPTION_PLANS,
    });
  } catch (error) {
    console.error("Error fetching credit packages:", error);
    return NextResponse.json(
      { error: "Failed to fetch credit packages" },
      { status: 500 }
    );
  }
}

// POST handler to process credit purchase
export async function POST(req) {
  try {
    console.log('Credit purchase API called');
    
    // Get user session
    const session = await auth();
    if (!session) {
      console.log('Unauthorized: No session found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('User ID from session:', userId);
    
    const body = await req.json();
    console.log('Request body:', body);
    
    const { packageId } = body;

    // Validate package ID
    console.log('Looking for package with ID:', packageId);
    console.log('Available packages:', ALL_PACKAGES);
    
    const selectedPackage = ALL_PACKAGES.find(pkg => pkg.id === packageId);
    if (!selectedPackage) {
      console.log('Invalid package selected:', packageId);
      return NextResponse.json(
        { error: "Invalid package selected" },
        { status: 400 }
      );
    }
    
    console.log('Selected package:', selectedPackage);

    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, credits: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create metadata for the purchase
    const metadata = {
      userId: user.id,
      packageId: selectedPackage.id,
      credits: selectedPackage.credits.toString(),
      packageName: selectedPackage.name,
      type: 'credit_purchase'
    };

    // Check if Stripe is initialized
    if (!stripe) {
      // If Stripe is not available, fall back to directly adding credits (for testing/development)
      console.log('Stripe not initialized, falling back to direct credit addition');
      
      // Add credits to user account
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          credits: user.credits + selectedPackage.credits,
        },
      });

      // Create a credit log entry
      await prisma.creditLog.create({
        data: {
          userId,
          amount: selectedPackage.credits,
          balanceBefore: user.credits,
          balanceAfter: updatedUser.credits,
          description: `Purchased ${selectedPackage.name} (${selectedPackage.credits} credits)`,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Credits added successfully (Stripe bypass mode)",
        newBalance: updatedUser.credits,
      });
    }
    
    // Create a Stripe checkout session
    console.log('Creating Stripe checkout session');
    const isSubscription = selectedPackage.isSubscription === true;
    
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: selectedPackage.name,
              description: isSubscription
                ? `${selectedPackage.name} - ${selectedPackage.credits} credits per month`
                : `${selectedPackage.credits} credits for PlanetQAi`,
            },
            unit_amount: selectedPackage.price * 100, // Convert to cents
            recurring: isSubscription ? { interval: 'month' } : undefined,
          },
          quantity: 1,
        },
      ],
      mode: isSubscription ? "subscription" : "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment?canceled=true`,
      metadata: {
        userId: userId,
        packageId: packageId,
        credits: selectedPackage.credits,
        type: isSubscription ? "subscription" : "credit_purchase",
        planName: isSubscription ? selectedPackage.name : undefined,
      },
    });

    // Return the Stripe checkout URL
    return NextResponse.json({
      success: true,
      url: stripeSession.url,
      sessionId: stripeSession.id
    });
  } catch (error) {
    console.error("Credit purchase error:", error.message);
    return NextResponse.json(
      { error: "Failed to process credit purchase", details: error.message },
      { status: 500 }
    );
  }
}
