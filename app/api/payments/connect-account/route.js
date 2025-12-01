// app/api/connect-account/route.js
import { auth } from "@/auth";
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Create a Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // Update with your country
      email: session.user.email,
      capabilities: {
        transfers: { requested: true },
      },
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/withdraw`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/withdraw?success=true`,
      type: 'account_onboarding',
    });

    // Save Stripe account ID to user in your database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeAccountId: account.id },
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Stripe Connect error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode || 500 }
    );
  }
}