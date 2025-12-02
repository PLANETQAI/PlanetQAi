import { getAuthenticatedUser } from "@/lib/api-auth";
import { getPackagesByType } from "@/lib/stripe_package";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET handler to retrieve user credits and available credit packages
export async function GET(req) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Get user with current credits
    const userWithCredits = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        credits: true,
        radioCredits: true,
        role: true,
        isRadioSubscribed: true,
        radioSubscriptionExpiresAt: true,
        totalCreditsUsed: true, // Assuming this field exists
      },
    });

    // Get credit logs for both credit types
    const creditLogs = await prisma.creditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

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
        normal: userWithCredits?.credits || 0,
        radio: userWithCredits?.radioCredits || 0,
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
    if (error.message.includes("Token") || error.message.includes("token")) {
        return NextResponse.json({ error: `Unauthorized: ${error.message}` }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch credit information" },
      { status: 500 }
    );
  }
}

// POST handler to process credit purchase
export async function POST(req) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const body = await req.json();
    const { packageId, creditType = 'normal' } = body;

    const packages = getPackagesByType(creditType);
    const selectedPackage = packages.find((pkg) => pkg.id === packageId);

    if (!selectedPackage) {
      return NextResponse.json(
        { error: `Invalid package selected. Package ID '${packageId}' not found.` },
        { status: 400 }
      );
    }

    if (typeof selectedPackage.credits === 'undefined') {
      return NextResponse.json(
        { error: `Selected package '${selectedPackage.id}' is missing the 'credits' field.` },
        { status: 400 }
      );
    }

    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    const customer = await stripe.customers.create({
      email: user.email,
      name: user.fullName,
      metadata: { userId: user.id },
    });
    const customerId = customer.id;

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
      ? { price: selectedPackage.id, quantity: 1 }
      : {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPackage.name,
              description: selectedPackage.description || `${selectedPackage.credits} Credits for PlanetQAi`,
            },
            unit_amount: selectedPackage.price * 100,
          },
          quantity: 1,
        };

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
        credits: selectedPackage.credits.toString(),
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
    if (error.message.includes("Token") || error.message.includes("token")) {
        return NextResponse.json({ error: `Unauthorized: ${error.message}` }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to process credit purchase" },
      { status: 500 }
    );
  }
}

