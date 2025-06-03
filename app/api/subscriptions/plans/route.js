// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define subscription plans with credit amounts
const SUBSCRIPTION_PLANS = [
  {
    id: "free-plan",
    title: "Free Plan",
    description: "Try Before You Buy",
    price: "$0",
    frequency: "/month",
    credits: 400,
    songs: 5,
    features: [
      "400 credits (5 songs)",
      "Credits available upon signup",
      "Standard audio quality",
      "Basic usage rights",
      "Explore the platform"
    ],
    packageId: "free-plan"
  },
  {
    id: "starter-plan",
    title: "Starter Plan",
    description: "Great for Beginners",
    price: "$10",
    frequency: "/month",
    credits: 20000,
    songs: 250,
    features: [
      "20,000 credits (250 songs)",
      "Credits refresh monthly",
      "Standard audio quality",
      "Commercial usage rights",
      "Ideal for independent artists"
    ],
    packageId: "prod_SQkSzKD1bvmB7e"
  },
  {
    id: "pro-plan",
    title: "Pro Plan",
    description: "For Serious Creators",
    price: "$20",
    frequency: "/month",
    credits: 40000,
    songs: 500,
    features: [
      "40,000 credits (500 songs)",
      "Credits refresh monthly",
      "High audio quality",
      "Commercial usage rights",
      "Priority access",
      "Perfect for content creators"
    ],
    packageId: "prod_SQkSDQBT6vs18R"
  },
  {
    id: "premium-plan",
    title: "Premium Plan",
    description: "Studio-Level Access",
    price: "$30",
    frequency: "/month",
    credits: 80000,
    songs: 1000,
    features: [
      "80,000 credits (1,000 songs)",
      "Credits refresh monthly",
      "Highest audio quality",
      "Full commercial usage rights",
      "Priority support",
      "Best value per song"
    ],
    packageId: "prod_SQkSPecauChp8L"
  }
];

// GET handler to retrieve available subscription plans
export async function GET(req) {
  try {
    // Get user session
    const session = await auth();
    
    // Get user subscription if logged in
    let userSubscription = null;
    if (session?.user?.id) {
      // Fetch user data - note: we're not using a subscription field since it doesn't exist in the schema
      const user = await prisma.user.findUnique({
        where: { id: session.user.id }
      });
      
      // For now, create a default subscription object with basic info
      // This can be expanded later when the subscription model is added to the schema
      if (user) {
        userSubscription = {
          planName: 'Free',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          cancelAtPeriodEnd: false
        };
      }
    }
    
    // Return available subscription plans
    return NextResponse.json({
      success: true,
      plans: SUBSCRIPTION_PLANS,
      userSubscription
    });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription plans" },
      { status: 500 }
    );
  }
}
