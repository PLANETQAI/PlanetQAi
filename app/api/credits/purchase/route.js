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
  { id: "prod_SNif9JuV1hG0Ux", name: "Small Pack", credits: 100, price: 5 },
  { id: "prod_SNihFWLdp5m3Uj", name: "Medium Pack", credits: 300, price: 12 },
  { id: "prod_SNijf10zShItPz", name: "Large Pack", credits: 700, price: 25 },
  { id: "prod_SNijpow92xtGMW", name: "Extra Large Pack", credits: 1500, price: 45 },
];

// GET handler to retrieve available credit packages
export async function GET(req) {
  try {
    // Get user session
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return available credit packages
    return NextResponse.json({
      success: true,
      packages: CREDIT_PACKAGES,
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
    console.log('Available packages:', CREDIT_PACKAGES);
    
    const selectedPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
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
      select: { id: true, email: true, name: true, credits: true },
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
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          // Use the product ID directly
          price_data: {
            currency: "usd",
            product: packageId, // Use the product ID from Stripe
            unit_amount: selectedPackage.price * 100, // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/payment?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/payment?canceled=true`,
      customer_email: user.email,
      metadata: metadata,
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
    return NextResponse.json(
      { error: "Failed to process credit purchase" },
      { status: 500 }
    );
  }
}
