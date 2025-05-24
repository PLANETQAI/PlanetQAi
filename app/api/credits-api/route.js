import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Define credit packages
const CREDIT_PACKAGES = [
  { id: "small", name: "Small Pack", credits: 100, price: 5 },
  { id: "medium", name: "Medium Pack", credits: 300, price: 12 },
  { id: "large", name: "Large Pack", credits: 700, price: 25 },
  { id: "xl", name: "Extra Large Pack", credits: 1500, price: 45 },
];

// GET handler to retrieve user credits and available credit packages
export async function GET(req) {
  try {
    // Get user session
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user credit information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        credits: true,
        maxMonthlyCredits: true,
        totalCreditsUsed: true,
        role: true,
        subscription: {
          select: {
            planName: true,
            status: true,
            currentPeriodEnd: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's recent credit logs
    const creditLogs = await prisma.creditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        amount: true,
        balanceAfter: true,
        description: true,
        createdAt: true,
      },
    });

    // Get user's recent songs
    const recentSongs = await prisma.song.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        creditsUsed: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      credits: user.credits,
      maxMonthlyCredits: user.maxMonthlyCredits,
      totalCreditsUsed: user.totalCreditsUsed,
      role: user.role,
      subscription: user.subscription,
      creditLogs,
      recentSongs,
      packages: CREDIT_PACKAGES,
    });
  } catch (error) {
    console.error("Credit check error:", error);
    return NextResponse.json(
      { error: "Failed to fetch credit information" },
      { status: 500 }
    );
  }
}

// POST handler to process credit purchase
export async function POST(req) {
  try {
    // Get user session
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { packageId } = body;

    // Validate package ID
    const selectedPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
    if (!selectedPackage) {
      return NextResponse.json(
        { error: "Invalid package selected" },
        { status: 400 }
      );
    }

    // Get current user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        email: true,
        fullName: true,
        credits: true,
        stripeCustomerId: true
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Import Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName,
        metadata: {
          userId: user.id
        }
      });
      customerId = customer.id;
      
      // Save the Stripe customer ID to the user
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId }
      });
    }
    
    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPackage.name,
              description: `${selectedPackage.credits} credits for PlanetQAi`,
              metadata: {
                packageId: selectedPackage.id
              }
            },
            unit_amount: selectedPackage.price * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/aistudio?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/aistudio?canceled=true`,
      metadata: {
        userId: userId,
        packageId: selectedPackage.id,
        credits: selectedPackage.credits.toString()
      }
    });

    return NextResponse.json({
      success: true,
      url: checkoutSession.url
    });
  } catch (error) {
    console.error("Credit purchase error:", error);
    return NextResponse.json(
      { error: "Failed to process credit purchase" },
      { status: 500 }
    );
  }
}
