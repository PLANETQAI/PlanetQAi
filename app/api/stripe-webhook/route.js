/* app/api/stripe-webhook/route.js */

import { ALL_PACKAGES, RADIO_SUBSCRIPTION_PLANS } from '@/lib/stripe_package';
import sendEmail from '@/utils/email/emailService';
import { purchaseReceiptTemplate } from '@/utils/email/emailTemplates';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// Initialize Stripe (ensure STRIPE_SECRET_KEY is set in .env.local)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15', // optional — update to your preferred API version
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Route config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Increase the max duration for this API route (default is 10s)
export const maxDuration = 30; // 30 seconds

// ---------------------- Helper functions ----------------------
function log(message, isError = false) {
  const stamp = new Date().toISOString();
  const prefix = isError ? 'ERROR' : 'INFO';
  // Use console so output shows up in your terminal where Next.js runs
  if (isError) console.error(`[${stamp}] ${prefix}: ${message}`);
  else console.log(`[${stamp}] ${prefix}: ${message}`);
}

function calculateSubscriptionEndDate(startDate, planId) {
  const plan = RADIO_SUBSCRIPTION_PLANS.find(p => p.id === planId);
  if (!plan) return null;

  const endDate = new Date(startDate);
  const { interval, interval_count } = plan;

  switch (interval) {
    case 'day':
      endDate.setDate(endDate.getDate() + interval_count);
      break;
    case 'week':
      endDate.setDate(endDate.getDate() + 7 * interval_count);
      break;
    case 'month': {
      const startDay = endDate.getDate();
      endDate.setMonth(endDate.getMonth() + interval_count);
      if (endDate.getDate() < startDay) {
        endDate.setDate(0);
      }
      break;
    }
    case 'year':
      endDate.setFullYear(endDate.getFullYear() + interval_count);
      break;
    default:
      return null;
  }

  return endDate;
}

function getSubscriptionEndDate(subscription, plan) {
  if (subscription.current_period_end) {
    return new Date(subscription.current_period_end * 1000);
  }
  const startDate = subscription.current_period_start
    ? new Date(subscription.current_period_start * 1000)
    : new Date();
  return calculateSubscriptionEndDate(startDate, plan.id);
}

function getPackageByProductId(productId) {
  return ALL_PACKAGES.find(pkg => pkg.id === productId) || null;
}

// ---------------------- Webhook handler ----------------------
export async function POST(request) {
  log(`Stripe webhook received`);
  // Add this at the start of your POST function
  const url = new URL(request.url);
  if (url.pathname === '/api/stripe-webhook') {
    return NextResponse.redirect(new URL('/api/stripe-webhook/', request.url), 308);
  }
  // Read raw body (string) — important: do NOT call request.json() or parse body first
  let rawBody;
  try {
    rawBody = await request.text(); // raw string body required for signature verification
  } catch (err) {
    log(`Failed to read raw body: ${String(err)}`, true);
    return new NextResponse('Failed to read request body', { status: 400 });
  }

  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    log('Missing stripe-signature header', true);
    return new NextResponse('Missing stripe-signature header', { status: 400 });
  }

  if (!webhookSecret) {
    log('Missing STRIPE_WEBHOOK_SECRET env var', true);
    return new NextResponse('Server misconfiguration: missing webhook secret', { status: 500 });
  }

  let event;
  try {
    // Stripe expects the exact raw payload — pass string or Buffer
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    log(`Signature verified for event ${event.type}`);
  } catch (err) {
    log(`Signature verification failed: ${err.message}`, true);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Process events (keeps your original logic; trimmed for clarity)
  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object;
        log(`Handling checkout.session.* for session ${session.id}`);

        // Only handle paid sessions
        if (session.payment_status !== 'paid') {
          log(`Session ${session.id} payment_status=${session.payment_status}. Skipping.`);
          return NextResponse.json({ received: true });
        }

        const userId = session.metadata?.userId;
        const packageId = session.metadata?.packageId;
        const creditType = session.metadata?.creditType || 'normal';
        let creditsToAdd = 0;

        if (creditType === 'normal') {
          creditsToAdd = parseInt(session.metadata?.credits, 10) || 0;
        } else {
          const plan = RADIO_SUBSCRIPTION_PLANS.find(p => p.id === packageId);
          if (plan && plan.interval_count) {
            creditsToAdd = plan.interval_count;
          } else {
            const amountPaid = (session.amount_total || 0) / 100;
            switch (amountPaid) {
              case 5: creditsToAdd = 1; break;
              case 12: creditsToAdd = 3; break;
              case 25: creditsToAdd = 6; break;
              case 45: creditsToAdd = 12; break;
              default: creditsToAdd = 1;
            }
          }
        }

        if (!userId || !creditsToAdd) {
          log(`Missing userId or creditsToAdd (userId=${userId}, credits=${creditsToAdd})`, true);
          return new NextResponse(JSON.stringify({ error: 'Missing metadata' }), { status: 400 });
        }

        // DB updates
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, fullName: true, credits: true, radioCredits: true, totalCreditsUsed: true }
        });

        if (!user) {
          log(`User not found: ${userId}`, true);
          return new NextResponse(JSON.stringify({ error: 'User not found' }), { status: 404 });
        }

        const creditField = creditType === 'radio' ? 'radioCredits' : 'credits';
        const currentCredits = user[creditField] || 0;
        const newCredits = currentCredits + creditsToAdd;

        const updateData = {
          [creditField]: newCredits,
          totalCreditsUsed: (user.totalCreditsUsed || 0) + creditsToAdd,
        };

        if (creditType === 'radio') {
          const plan = RADIO_SUBSCRIPTION_PLANS.find(p => p.id === packageId);
          if (plan) {
            updateData.radioSubscriptionExpiresAt = getSubscriptionEndDate({ current_period_start: Math.floor(Date.now() / 1000) }, plan);
            updateData.isRadioSubscribed = true;
          } else {
            updateData.radioSubscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            updateData.isRadioSubscribed = true;
          }
        }

        await prisma.user.update({ where: { id: userId }, data: updateData });

        await prisma.creditLog.create({
          data: {
            userId,
            creditType,
            amount: creditsToAdd,
            balanceAfter: newCredits,
            description: `Purchased ${creditsToAdd} ${creditType} credits`,
            relatedEntityId: session.id,
            relatedEntityType: 'stripe_payment',
          }
        });

        // Send receipt (best-effort) - moved to background
        try {
          let packageName = session.metadata?.packageName || `${creditsToAdd} Credits Package`;
          let packagePrice = session.amount_total || 0;

          // Get package details from metadata first (faster)
          if (session.metadata?.packageId) {
            const packageDetails = getPackageByProductId(session.metadata.packageId);
            if (packageDetails) {
              packageName = packageDetails.name;
              packagePrice = packageDetails.price * 100;
            }
          }

          const { html, text } = purchaseReceiptTemplate(
            user.fullName || (user.email?.split?.('@')?.[0] ?? 'Customer'),
            creditsToAdd,
            packagePrice,
            session.id,
            packageName
          );

          await sendEmail(user.email, 'Thank You for Your Purchase on PlanetQAi', html, text);
          log(`Receipt sent to ${user.email}`);
        } catch (emailErr) {
          log(`Failed to send receipt: ${String(emailErr)}`, true);
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const failedUserId = pi.metadata?.userId;
        log(`Payment failed for user ${failedUserId}: ${pi.last_payment_error?.message || 'Unknown'}`, true);
        break;
      }

      case 'checkout.session.expired': {
        const s = event.data.object;
        log(`Checkout session expired: ${s.id} metadata.userId=${s.metadata?.userId}`);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const subscriptionUserId = subscription.metadata?.userId;
        if (!subscriptionUserId) {
          log('Missing userId on subscription metadata', true);
          return new NextResponse(JSON.stringify({ error: 'Missing user ID in metadata' }), { status: 400 });
        }

        // Fetch user
        const user = await prisma.user.findUnique({ where: { id: subscriptionUserId }, select: { id: true, credits: true, radioCredits: true, totalCreditsUsed: true } });
        if (!user) {
          log(`Subscription user not found: ${subscriptionUserId}`, true);
          return new NextResponse(JSON.stringify({ error: 'User not found' }), { status: 404 });
        }

        const planId = subscription.plan?.id;
        const plan = RADIO_SUBSCRIPTION_PLANS.find(p => p.id === planId);
        if (!plan) {
          log(`Plan not found for subscription planId=${planId}`, true);
          return new NextResponse(JSON.stringify({ error: 'Plan not found' }), { status: 400 });
        }

        const creditType = subscription.metadata?.creditType || 'normal';
        const isRadio = creditType === 'radio';
        const creditsPerPeriod = isRadio ? 500 : (parseInt(subscription.metadata?.credits, 10) || 0);

        const updateData = {
          stripeSubscriptionId: subscription.id,
          planName: plan.name,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
          subscriptionStatus: subscription.status
        };

        if (isRadio) {
          updateData.isRadioSubscribed = true;
          updateData.radioSubscriptionExpiresAt = getSubscriptionEndDate(subscription, plan);
          updateData.radioCredits = (user.radioCredits || 0) + creditsPerPeriod;
        } else {
          updateData.credits = (user.credits || 0) + creditsPerPeriod;
          updateData.totalCreditsUsed = (user.totalCreditsUsed || 0) + creditsPerPeriod;
        }

        const updatedUser = await prisma.user.update({ where: { id: subscriptionUserId }, data: updateData, select: { credits: true, radioCredits: true } });

        await prisma.creditLog.create({
          data: {
            userId: subscriptionUserId,
            amount: creditsPerPeriod,
            balanceBefore: isRadio ? (user.radioCredits || 0) : (user.credits || 0),
            balanceAfter: isRadio ? updatedUser.radioCredits : updatedUser.credits,
            description: `Added ${creditsPerPeriod} credits from ${plan.name} subscription`,
            relatedEntityId: subscription.id,
            relatedEntityType: 'stripe_subscription',
            creditType,
          }
        });

        log(`Processed subscription for user ${subscriptionUserId}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const canceled = event.data.object;
        const canceledUserId = canceled.metadata?.userId;
        log(`Subscription canceled for user ${canceledUserId}`);
        if (!canceledUserId) {
          log('Missing userId for canceled subscription', true);
          return new NextResponse(JSON.stringify({ error: 'Missing user ID in metadata' }), { status: 400 });
        }

        await prisma.user.update({
          where: { id: canceledUserId },
          data: {
            status: 'Canceled',
            cancelAtPeriodEnd: true,
            currentPeriodEnd: new Date(canceled.current_period_end * 1000),
            isRadioSubscribed: false,
            radioCredits: 0,
          }
        });

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const invoiceUserId = invoice.metadata?.userId || invoice.customer_metadata?.userId;
        const subscriptionId = invoice.subscription;

        if (subscriptionId && invoiceUserId) {
          log(`Processing invoice.payment_succeeded for user ${invoiceUserId}`);
          const subscriptionDetails = await stripe.subscriptions.retrieve(subscriptionId);
          const creditsPerPeriod = parseInt(subscriptionDetails.metadata?.credits, 10) || 0;

          const user = await prisma.user.findUnique({ where: { id: invoiceUserId }, select: { id: true, email: true, credits: true } });
          if (!user) {
            log(`User not found for invoice: ${invoiceUserId}`, true);
            return new NextResponse(JSON.stringify({ error: 'User not found' }), { status: 404 });
          }

          const updatedUser = await prisma.user.update({
            where: { id: invoiceUserId },
            data: { credits: (user.credits || 0) + creditsPerPeriod, currentPeriodEnd: new Date(subscriptionDetails.current_period_end * 1000) }
          });

          await prisma.creditLog.create({
            data: {
              userId: invoiceUserId,
              amount: creditsPerPeriod,
              balanceBefore: user.credits,
              balanceAfter: updatedUser.credits,
              description: `Renewal credits for subscription ${subscriptionDetails.id}`,
              relatedEntityId: invoice.id,
              relatedEntityType: 'stripe_invoice'
            }
          });

          log(`Added ${creditsPerPeriod} renewal credits to user ${invoiceUserId}`);
        }
        break;
      }

      default:
        log(`Unhandled Stripe event type: ${event.type}`);
    }

    log(`Webhook ${event.type} processed successfully`);
    return NextResponse.json({ received: true });
  } catch (err) {
    log(`Webhook processing error: ${String(err)}`, true);
    // Ensure any thrown DB errors bubble as 500
    return new NextResponse(JSON.stringify({ error: 'Webhook handler failed' }), { status: 500 });
  }
}
