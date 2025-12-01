import { auth } from "@/auth";
import { getPackagesByType } from "@/lib/stripe_package";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET handler to retrieve user credits and available credit packages
export async function GET(req) {
  try {
    // Get user session
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user information (basic details)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user with current credits
    const userWithCredits = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        credits: true,
        radioCredits: true,
        role: true,
        isRadioSubscribed: true,
        radioSubscriptionExpiresAt: true
      },
    });

    // Get credit logs for both credit types
    const creditLogs = await prisma.creditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Group logs by credit type
    const creditBalances = {
      normal: {
        current: userWithCredits?.credits || 0,
        logs: creditLogs.filter(log => log.creditType === 'normal')
      },
      radio: {
        current: userWithCredits?.radioCredits || 0,
        logs: creditLogs.filter(log => log.creditType === 'radio')
      }
    };

    // Get recent songs and media
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

    const recentMedia = await prisma.media.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        creditsUsed: true,
        mediaType: true,
        createdAt: true,
      },
    });

    // Get credit packages by type
    const normalPackages = getPackagesByType('normal');
    const radioPackages = getPackagesByType('radio');
    const subscriptionPlans = getPackagesByType('subscription');

    return NextResponse.json({
      success: true,
      credits: {
        normal: creditBalances.normal.current,
        radio: creditBalances.radio.current,
        totalCreditsUsed: userWithCredits?.totalCreditsUsed || 0,
        isRadioSubscribed: userWithCredits?.isRadioSubscribed,
        radioSubscriptionExpiresAt: userWithCredits?.radioSubscriptionExpiresAt
      },
      packages: {
        normal: normalPackages,
        radio: radioPackages,
        subscriptions: subscriptionPlans,
      },
      role: user.role,
      creditLogs: creditLogs,
      recentActivity: {
        songs: recentSongs,
        media: recentMedia,
      },
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
    const { packageId, creditType = 'normal' } = body;

    // Get all packages of the requested type
    const packages = getPackagesByType(creditType);


    // Log available packages for debugging
    console.log("Available packages:", packages);
    console.log("Requested package ID:", packageId);

    // Validate package ID
    const selectedPackage = packages.find((pkg) => pkg.id === packageId);
    console.log("Selected package:", selectedPackage);

    if (!selectedPackage) {
      console.log("Available packages:", packages);
      console.log("Requested package ID:", packageId);
      return NextResponse.json(
        { error: `Invalid package selected. Package ID '${packageId}' not found in available packages.` },
        { status: 400 }
      );
    }

    // Validate credits field
    if (typeof selectedPackage.credits === 'undefined') {
      console.log("Selected package missing credits:", selectedPackage);
      return NextResponse.json(
        { error: `Selected package '${selectedPackage.id}' is missing the 'credits' field.` },
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
        radioCredits: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Import Stripe
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    // Always create a new Stripe customer to avoid test/live mode conflicts
    // Delete existing customer ID and create a new one
    let customerId;

    // Create a new customer regardless of existing ID
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.fullName,
      metadata: {
        userId: user.id,
      },
    });
    customerId = customer.id;

    // Save the new Stripe customer ID to the user
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });

    const isRadio = creditType === 'radio';

    const successUrl = isRadio
      ? `${process.env.NEXT_PUBLIC_APP_URL}/productions?success=true&session_id={CHECKOUT_SESSION_ID}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/aistudio?success=true&session_id={CHECKOUT_SESSION_ID}`;

    const cancelUrl = isRadio
      ? `${process.env.NEXT_PUBLIC_APP_URL}/productions?canceled=true`
      : `${process.env.NEXT_PUBLIC_APP_URL}/aistudio?canceled=true`;


    const lineItem = creditType === 'radio'
      ? {
        price: selectedPackage.id, // Use the recurring price ID
        quantity: 1,
      }
      : {
        price_data: {
          currency: 'usd',
          product_data: {
            name: selectedPackage.name,
            description: selectedPackage.description || `${selectedPackage.credits} Credits for PlanetQAi`,
            metadata: {
              packageId: selectedPackage.id,
              creditType: creditType,
              credits: selectedPackage.credits.toString(),
            },
          },
          unit_amount: selectedPackage.price * 100,
        },
        quantity: 1,
      };

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [lineItem],
      mode: creditType === 'radio' ? 'subscription' : 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId,
        packageId: selectedPackage.id,
        credits: creditType === 'radio' ? selectedPackage.credits.toString() : selectedPackage.credits.toString(),
        creditType: creditType,
        ...(creditType === 'radio' && {
          interval: selectedPackage.interval,
          interval_count: selectedPackage.interval_count.toString(),
          subscriptionType: 'radio'
        })
      },
    });

    return NextResponse.json({
      success: true,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Credit purchase error:", error);
    return NextResponse.json(
      { error: "Failed to process credit purchase" },
      { status: 500 }
    );
  }
}
