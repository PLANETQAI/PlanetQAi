import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY);

const prisma = new PrismaClient();

// Define credit packages
const CREDIT_PACKAGES = [
  { id: "small", name: "Small Pack", credits: 100, price: 5 },
  { id: "medium", name: "Medium Pack", credits: 300, price: 12 },
  { id: "large", name: "Large Pack", credits: 700, price: 25 },
  { id: "xl", name: "Extra Large Pack", credits: 1500, price: 45 },
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

    // Create a Stripe checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${selectedPackage.name} - ${selectedPackage.credits} Credits`,
              description: `Purchase ${selectedPackage.credits} credits for PlanetQAi`,
              images: ["https://planetqproductions.com/images/logo.png"],
            },
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
