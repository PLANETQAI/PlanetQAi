import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import fs from 'fs';
import path from 'path';
import sendEmail from '../../../utils/email/emailService';
import { purchaseReceiptTemplate } from '../../../utils/email/emailTemplates';

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
const CREDIT_PACKAGES = [
  { id: "prod_SNif9JuV1hG0Ux", name: "Small Pack", credits: 100, price: 5 },
  { id: "prod_SNihFWLdp5m3Uj", name: "Medium Pack", credits: 300, price: 12 },
  { id: "prod_SNijf10zShItPz", name: "Large Pack", credits: 700, price: 25 },
  { id: "prod_SNijpow92xtGMW", name: "Extra Large Pack", credits: 1500, price: 45 },
];

// Helper function to get package details by product ID
function getPackageByProductId(productId) {
  return CREDIT_PACKAGES.find(pkg => pkg.id === productId) || null;
}

// Create a log directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Function to log webhook events to a file
function logToFile(message, isError = false) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${isError ? 'ERROR: ' : ''}${message}\n`;
  
  // Log to console
  if (isError) {
    console.error(logMessage);
  } else {
    console.log(logMessage);
  }
  
  // Log to file
  const logFile = path.join(logDir, 'stripe-webhooks.log');
  fs.appendFileSync(logFile, logMessage);
}

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  logToFile(`🔔 Stripe webhook received at ${new Date().toISOString()}`);
  
  try {
    // Get the raw request body
    const text = await request.text();
    
    // Get the Stripe signature from headers
    const headersList = headers();
    const signature = headersList.get('stripe-signature');
    
    logToFile(`🔑 Stripe signature: ${signature}`);
    logToFile(`📝 Webhook secret: ${webhookSecret ? 'Present (not showing for security)' : 'Missing!'}`); 
    logToFile(`📝 Raw request body (first 200 chars): ${text.substring(0, 200)}...`);
    
    // Verify the webhook signature
    let event;
    try {
      if (!webhookSecret) {
        throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
      }
      
      event = stripe.webhooks.constructEvent(text, signature, webhookSecret);
      logToFile(`✅ Webhook signature verified successfully`);
    } catch (err) {
      logToFile(`⚠️ Webhook signature verification failed: ${err.message}`, true);
      return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }
    
    // Log the event type
    logToFile(`📦 Event type: ${event.type}`);
    logToFile(`📦 Event ID: ${event.id}`);
    
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
        
        logToFile(`💳 Processing checkout.session.completed for user ${userId}`);
        logToFile(`📦 Package ID: ${packageId}`);
        logToFile(`💰 Credits to add: ${creditsToAdd}`);
        logToFile(`💳 Payment status: ${session.payment_status}`);
        
        // Only process if payment is successful
        if (session.payment_status !== 'paid') {
          logToFile(`⚠️ Payment not completed. Status: ${session.payment_status}`);
          return new NextResponse(JSON.stringify({ received: true }));
        }
        
        if (!userId || !creditsToAdd) {
          logToFile(`❌ Missing required metadata in Stripe session. userId: ${userId}, credits: ${creditsToAdd}`, true);
          return new NextResponse(JSON.stringify({ error: 'Missing metadata' }), { status: 400 });
        }
        
        // Get current user credits
        try {
          logToFile(`🔍 Looking up user ${userId} in database`);
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { credits: true, email: true, fullName: true },
          });
          
          if (!user) {
            logToFile(`❌ User not found: ${userId}`, true);
            return new NextResponse(JSON.stringify({ error: 'User not found' }), { status: 404 });
          }
          
          logToFile(`👤 User found: ${userId}, current credits: ${user.credits}, email: ${user.email}`);
          
          // Add credits to user account
          logToFile(`💰 Updating user credits from ${user.credits} to ${user.credits + creditsToAdd}`);
          const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
              credits: user.credits + creditsToAdd,
            },
          });
          
          logToFile(`✅ Credits updated successfully. New balance: ${updatedUser.credits}`);
          
          // Create a credit log entry
          logToFile(`📝 Creating credit log entry`);
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
          
          logToFile(`✅ Credit log created successfully with ID: ${creditLog.id}`);
          logToFile(`🎉 Successfully added ${creditsToAdd} credits to user ${userId}`);
          
          // Send purchase receipt email
          try {
            logToFile(`📧 Sending purchase receipt email to ${user.email}`);
            
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
            
            logToFile(`✅ Purchase receipt email sent successfully to ${user.email}`);
          } catch (emailError) {
            logToFile(`⚠️ Failed to send purchase receipt email: ${emailError.message}`, true);
            // Don't throw the error, just log it - we don't want to fail the webhook if email fails
          }
        } catch (dbError) {
          logToFile(`❌ Database error while processing webhook: ${dbError.message}`, true);
          logToFile(`Stack trace: ${dbError.stack}`, true);
          throw dbError;
        }
        break;
        
      case 'payment_intent.payment_failed':
        const paymentIntent = event.data.object;
        const failedUserId = paymentIntent.metadata?.userId;
        
        logToFile(`❌ Payment failed for user ${failedUserId}`);  
        logToFile(`❌ Payment failure reason: ${paymentIntent.last_payment_error?.message || 'Unknown'}`);  
        
        // You could implement notification logic here
        // For example, update a user record or send an email
        
        break;
        
      case 'checkout.session.expired':
        const expiredSession = event.data.object;
        const expiredUserId = expiredSession.metadata?.userId;
        
        logToFile(`⏰ Checkout session expired for user ${expiredUserId}`);  
        
        // You could implement cleanup or notification logic here
        
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        const subscriptionUserId = subscription.metadata?.userId;
        
        logToFile(`📦 Processing subscription event for user ${subscriptionUserId}`);
        logToFile(`📦 Subscription status: ${subscription.status}`);
        
        // Handle subscription events here
        // This could update the user's subscription status in your database
        // For now, we'll just log it
        
        break;
        
      default:
        logToFile(`⚠️ Unhandled event type: ${event.type}`);
    }
    
    logToFile(`✅ Webhook processed successfully`);
    return new NextResponse(JSON.stringify({ received: true }));
  } catch (error) {
    logToFile(`❌ Webhook error: ${error.message}`, true);
    logToFile(`Stack trace: ${error.stack}`, true);
    return new NextResponse(JSON.stringify({ error: 'Webhook handler failed' }), { status: 500 });
  }
}
