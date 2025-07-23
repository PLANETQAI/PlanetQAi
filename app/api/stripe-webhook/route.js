import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import sendEmail from '../../../utils/email/emailService';
import { purchaseReceiptTemplate } from '../../../utils/email/emailTemplates';
import { CREDIT_PACKAGES, SUBSCRIPTION_PLANS, ALL_PACKAGES } from '../../../lib/stripe_package';

/**
 * STRIPE WEBHOOK CONFIGURATION
 * 
 * Subscribe to the following events in your Stripe Dashboard:
 * 
 * For Credit Packages (one-time purchases):
 * - checkout.session.completed (When a customer completes checkout)
 * - checkout.session.async_payment_succeeded (For payment methods that complete after checkout)
 * - checkout.session.expired (When a checkout session expires without completion)
 * - payment_intent.payment_failed (When a payment fails)
 * 
 * Credit packages in the system:
 * - Small Pack: 100 credits for $5 (prod_SNif9JuV1hG0Ux)
 * - Medium Pack: 300 credits for $12 (prod_SNihFWLdp5m3Uj)
 * - Large Pack: 700 credits for $25 (prod_SNijf10zShItPz)
 * - Extra Large Pack: 1500 credits for $45 (prod_SNijpow92xtGMW)
 */

// Initialize Prisma and Stripe
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Define credit packages (same as in credits-api/route.js)
// const CREDIT_PACKAGES = [
//   { id: "prod_SNif9JuV1hG0Ux", name: "Small Pack", credits: 100, price: 5 },
//   { id: "prod_SNihFWLdp5m3Uj", name: "Medium Pack", credits: 300, price: 12 },
//   { id: "prod_SNijf10zShItPz", name: "Large Pack", credits: 700, price: 25 },
//   { id: "prod_SNijpow92xtGMW", name: "Extra Large Pack", credits: 1500, price: 45 },
// ];



// Define subscription plans (same as in credits-api/route.js)
// const SUBSCRIPTION_PLANS = [
//   { id: "prod_SQJRcw0CvcrPLc", name: "Starter Plan", credits: 20000, price: 10, isSubscription: true },
//   { id: "prod_SQJSScMORjkNzM", name: "Pro Plan", credits: 40000, price: 20, isSubscription: true },
//   { id: "prod_SQJSn9xSxfYUwq", name: "Premium Plan", credits: 80000, price: 30, isSubscription: true },
// ];

// Using ALL_PACKAGES imported from stripe_package.js

// Helper function to get package details by product ID
function getPackageByProductId(productId) {
  return ALL_PACKAGES.find(pkg => pkg.id === productId) || null;
}

// Function to log safely (console only, no file logging)
function logToFile(message, isError = false) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${isError ? 'ERROR: ' : ''}${message}`;
  
  // Log to console only
  if (isError) {
    console.error(logMessage);
  } else {
    console.log(logMessage);
  }
}

// Route segment config - ensure we're using Node.js runtime and force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  logToFile(`🔔 Stripe webhook received at ${new Date().toISOString()}`);
  
  try {
    // Get the raw request body as a buffer to preserve exact format - ONLY READ ONCE
    const buffer = await request.arrayBuffer();
    const rawBuffer = Buffer.from(buffer);
    const text = rawBuffer.toString('utf8');
    
    // Get the Stripe signature from headers
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    console.log('Raw buffer length:', buffer.byteLength);
    console.log('Signature present:', !!signature);
    console.log('Webhook secret present:', !!webhookSecret);
    
    // Verify the webhook signature
    let event;
    try {
      if (!signature) {
        throw new Error('Missing Stripe signature in request headers');
      }
      
      if (!webhookSecret) {
        throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
      }
      
      // Use the simplest possible approach for signature verification
      console.log(`🔄 Attempting to verify webhook signature...`);
      try {
       
        console.log(`🔑 Signature (first 20 chars): ${signature ? signature.substring(0, 20) : 'missing'}...`);
        console.log(`📝 Buffer length: ${rawBuffer.length}`);
        console.log(`📝 Buffer sample (first 20 bytes): ${rawBuffer.slice(0, 20).toString('hex')}`);
       
        // Use the standard approach recommended by Stripe
        event = await stripe.webhooks.constructEventAsync(
          rawBuffer, 
          signature, 
          webhookSecret
        );
        
        console.log(`✅ Webhook signature verified successfully`);
      } catch (verifyError) {
        console.log(`⚠️ Webhook verification error details: ${verifyError.message}`, true);
        console.log(`⚠️ Error stack: ${verifyError.stack}`, true);
        throw verifyError;
      }
    } catch (err) {
      console.log(`⚠️ Webhook signature verification failed: ${err.message}`, true);
      return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }
    
    // Log the event type
    console.log(`📦 Event type: ${event.type}`);
    console.log(`📦 Event ID: ${event.id}`);
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        const session = event.data.object;
        
        // Log the full session object for debugging
        logToFile(`💳 Full checkout session data: ${JSON.stringify(session, null, 2)}`);
        
        // Extract metadata
        const userId = session.metadata?.userId;
        const packageId = session.metadata?.packageId;
        const creditsToAdd = parseInt(session.metadata?.credits, 10) || 0;
        
        // logToFile(`💳 Processing checkout.session.completed for user ${userId}`);
        // logToFile(`📦 Package ID: ${packageId}`);
        // logToFile(`💰 Credits to add: ${creditsToAdd}`);
        // logToFile(`💳 Payment status: ${session.payment_status}`);
        
        // Only process if payment is successful
        if (session.payment_status !== 'paid') {
          console.log(`⚠️ Payment not completed. Status: ${session.payment_status}`);
          return new NextResponse(JSON.stringify({ received: true }));
        }
        
        if (!userId || !creditsToAdd) {
          console.log(`❌ Missing required metadata in Stripe session. userId: ${userId}, credits: ${creditsToAdd}`, true);
          return new NextResponse(JSON.stringify({ error: 'Missing metadata' }), { status: 400 });
        }
        
        // Get current user credits
        try {
          console.log(`🔍 Looking up user ${userId} in database`);
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { credits: true, email: true, fullName: true },
          });
          
          if (!user) {
            console.log(`❌ User not found: ${userId}`, true);
            return new NextResponse(JSON.stringify({ error: 'User not found' }), { status: 404 });
          }
          
          console.log(`👤 User found: ${userId}, current credits: ${user.credits}, email: ${user.email}`);
          
          // Add credits to user account
          console.log(`💰 Updating user credits from ${user.credits} to ${user.credits + creditsToAdd}`);
          const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
              credits: user.credits + creditsToAdd,
            },
          });
          
          console.log(`✅ Credits updated successfully. New balance: ${updatedUser.credits}`);
          
          // Create a credit log entry
          console.log(`📝 Creating credit log entry`);
          const creditLog = await prisma.creditLog.create({
            data: {
              userId,
              amount: creditsToAdd,
              balanceAfter: updatedUser.credits,
              description: `Purchased ${creditsToAdd} credits (Stripe payment)`,
              relatedEntityId: session.id,
              relatedEntityType: 'stripe_session',
            },
          });
          
          console.log(`✅ Credit log created successfully with ID: ${creditLog.id}`);
          console.log(`🎉 Successfully added ${creditsToAdd} credits to user ${userId}`);
          
          // Send purchase receipt email
          try {
            console.log(`📧 Sending purchase receipt email to ${user.email}`);
            
            // Get package details from product ID or metadata
            let packageName = `${creditsToAdd} Credits Package`;
            let packagePrice = session.amount_total || 0;
            
            // Try to get package details from line items
            if (session.line_items?.data?.length > 0) {
              // If line_items is available in the session
              const lineItem = session.line_items.data[0];
              const productId = lineItem.price?.product;
              
              if (productId) {
                const packageDetails = getPackageByProductId(productId);
                if (packageDetails) {
                  packageName = packageDetails.name;
                  packagePrice = packageDetails.price * 100; // Convert to cents for consistency
                }
              }
            } else if (session.metadata?.packageId) {
              // If product ID is in metadata
              const packageDetails = getPackageByProductId(session.metadata.packageId);
              if (packageDetails) {
                packageName = packageDetails.name;
                packagePrice = packageDetails.price * 100; // Convert to cents for consistency
              }
            } else if (session.metadata?.packageName) {
              // If package name is directly in metadata
              packageName = session.metadata.packageName;
            }
            
            // Generate receipt email
            const { html, text } = purchaseReceiptTemplate(
              user.fullName || user.email.split('@')[0], // Use full name or fallback to email username
              creditsToAdd,
              packagePrice, // Use the package price we determined
              session.id,
              packageName
            );
            
            // Send the email
            await sendEmail(
              user.email,
              'Thank You for Your Purchase on PlanetQAi',
              html,
              text
            );
            
            console.log(`✅ Purchase receipt email sent successfully to ${user.email}`);
          } catch (emailError) {
            console.log(`⚠️ Failed to send purchase receipt email: ${emailError.message}`, true);
            // Don't throw the error, just log it - we don't want to fail the webhook if email fails
          }
        } catch (dbError) {
          console.log(`❌ Database error while processing webhook: ${dbError.message}`, true);
          console.log(`Stack trace: ${dbError.stack}`, true);
          throw dbError;
        }
        break;
        
      case 'payment_intent.payment_failed':
        const paymentIntent = event.data.object;
        const failedUserId = paymentIntent.metadata?.userId;
        
        console.log(`❌ Payment failed for user ${failedUserId}`);  
        console.log(`❌ Payment failure reason: ${paymentIntent.last_payment_error?.message || 'Unknown'}`);  
        
        // You could implement notification logic here
        // For example, update a user record or send an email
        
        break;
        
      case 'checkout.session.expired':
        const expiredSession = event.data.object;
        const expiredUserId = expiredSession.metadata?.userId;
        
        console.log(`⏰ Checkout session expired for user ${expiredUserId}`);  
        
        // You could implement cleanup or notification logic here
        
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        const subscriptionUserId = subscription.metadata?.userId;
        const planName = subscription.metadata?.planName;
        const creditsPerPeriod = parseInt(subscription.metadata?.credits, 10) || 0;
        
        console.log(`📦 Processing subscription event for user ${subscriptionUserId}`);
        console.log(`📦 Subscription status: ${subscription.status}`);
        console.log(`📦 Plan name: ${planName}`);
        console.log(`📦 Credits per period: ${creditsPerPeriod}`);
        
        if (!subscriptionUserId) {
          console.log(`❌ Missing user ID in subscription metadata`, true);
          return new NextResponse(JSON.stringify({ error: 'Missing user ID in metadata' }), { status: 400 });
        }
        
        try {
          // Get the user
          const user = await prisma.user.findUnique({
            where: { id: subscriptionUserId },
            select: { id: true, email: true, credits: true },
          });
          
          if (!user) {
            console.log(`❌ User not found: ${subscriptionUserId}`, true);
            return new NextResponse(JSON.stringify({ error: 'User not found' }), { status: 404 });
          }
          
          // Update user's subscription status
          if (subscription.status === 'active') {
            // For new subscriptions, add the initial credits
            if (event.type === 'customer.subscription.created') {
              // Add subscription credits to user account
              console.log(`💰 Adding ${creditsPerPeriod} subscription credits to user ${subscriptionUserId}`);
              
              const updatedUser = await prisma.user.update({
                where: { id: subscriptionUserId },
                data: {
                  credits: user.credits + creditsPerPeriod,
                },
              });
              
              // Create a credit log entry for the subscription credits
              await prisma.creditLog.create({
                data: {
                  userId: subscriptionUserId,
                  amount: creditsPerPeriod,
                  balanceBefore: user.credits,
                  balanceAfter: updatedUser.credits,
                  description: `Added ${creditsPerPeriod} credits from ${planName} subscription`,
                  relatedEntityId: subscription.id,
                  relatedEntityType: 'stripe_subscription',
                },
              });
              
              console.log(`✅ Added ${creditsPerPeriod} subscription credits to user ${subscriptionUserId}`);
            }
            
            // Update the user's subscription record
            await prisma.user.update({
              where: { id: subscriptionUserId },
              data: {
                stripeSubscriptionId: subscription.id,
                planName: planName,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                status: 'Active',
              },
            });
            
            console.log(`✅ Updated subscription status for user ${subscriptionUserId}`);
          }
        } catch (dbError) {
          console.log(`❌ Database error while processing subscription: ${dbError.message}`, true);
          console.log(`Stack trace: ${dbError.stack}`, true);
          throw dbError;
        }
        
        break;
        
      case 'customer.subscription.deleted':
        const canceledSubscription = event.data.object;
        const canceledUserId = canceledSubscription.metadata?.userId;
        
        console.log(`📦 Processing subscription cancellation for user ${canceledUserId}`);
        
        if (!canceledUserId) {
          console.log(`❌ Missing user ID in canceled subscription metadata`, true);
          return new NextResponse(JSON.stringify({ error: 'Missing user ID in metadata' }), { status: 400 });
        }
        
        try {
          // Update the user's subscription status to canceled
          await prisma.user.update({
            where: { id: canceledUserId },
            data: {
              status: 'Canceled',
              cancelAtPeriodEnd: true,
            },
          });
          
          console.log(`✅ Updated subscription status to canceled for user ${canceledUserId}`);
        } catch (dbError) {
          console.log(`❌ Database error while processing subscription cancellation: ${dbError.message}`, true);
          console.log(`Stack trace: ${dbError.stack}`, true);
          throw dbError;
        }
        
        break;
        
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        const invoiceUserId = invoice.metadata?.userId || invoice.customer_metadata?.userId;
        const subscriptionId = invoice.subscription;
        
        // Only process subscription invoices
        if (subscriptionId && invoiceUserId) {
          console.log(`📦 Processing subscription renewal for user ${invoiceUserId}`);
          
          try {
            // Get subscription details
            const subscriptionDetails = await stripe.subscriptions.retrieve(subscriptionId);
            const planName = subscriptionDetails.metadata?.planName;
            const creditsPerPeriod = parseInt(subscriptionDetails.metadata?.credits, 10) || 0;
            
            // Get the user
            const user = await prisma.user.findUnique({
              where: { id: invoiceUserId },
              select: { id: true, email: true, credits: true },
            });
            
            if (!user) {
              console.log(`❌ User not found: ${invoiceUserId}`, true);
              return new NextResponse(JSON.stringify({ error: 'User not found' }), { status: 404 });
            }
            
            // Add subscription credits to user account for the renewal
            console.log(`💰 Adding ${creditsPerPeriod} renewal credits to user ${invoiceUserId}`);
            
            const updatedUser = await prisma.user.update({
              where: { id: invoiceUserId },
              data: {
                credits: user.credits + creditsPerPeriod,
                currentPeriodEnd: new Date(subscriptionDetails.current_period_end * 1000),
              },
            });
            
            // Create a credit log entry for the renewal credits
            await prisma.creditLog.create({
              data: {
                userId: invoiceUserId,
                amount: creditsPerPeriod,
                balanceBefore: user.credits,
                balanceAfter: updatedUser.credits,
                description: `Renewal: Added ${creditsPerPeriod} credits from ${planName} subscription`,
                relatedEntityId: invoice.id,
                relatedEntityType: 'stripe_invoice',
              },
            });
            
            console.log(`✅ Added ${creditsPerPeriod} renewal credits to user ${invoiceUserId}`);
          } catch (dbError) {
            console.log(`❌ Database error while processing invoice: ${dbError.message}`, true);
            console.log(`Stack trace: ${dbError.stack}`, true);
            throw dbError;
          }
        }
        
        break;
        
      default:
        logToFile(`⚠️ Unhandled event type: ${event.type}`);
    }
    
    console.log(`✅ Webhook processed successfully`);
    return new NextResponse(JSON.stringify({ received: true }));
  } catch (error) {
    console.log(`❌ Webhook error: ${error.message}`, true);
    console.log(`Stack trace: ${error.stack}`, true);
    return new NextResponse(JSON.stringify({ error: 'Webhook handler failed' }), { status: 500 });
  }
}
