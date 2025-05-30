import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { headers } from 'next/headers';
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
    // Get the raw request body as a buffer to preserve exact format
    const buffer = await request.arrayBuffer();
    const text = Buffer.from(buffer).toString('utf8');
    
    // Get the Stripe signature from headers
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

     console.log('Raw buffer length:', buffer.byteLength);
     console.log('Signature present:', !!signature);
     console.log('Webhook secret present:', !!webhookSecret);
    
    // Enhanced logging for debugging
    // logToFile(`🔑 Stripe signature length: ${signature ? signature.length : 0}`);
    // logToFile(`🔑 Stripe signature present: ${!!signature}`);
    // logToFile(`📝 Webhook secret present: ${!!webhookSecret}`);
    // logToFile(`📝 Webhook secret length: ${webhookSecret ? webhookSecret.length : 0}`);
    // logToFile(`📝 Raw request body length: ${text ? text.length : 0}`);
    // logToFile(`📝 Raw request body format: ${typeof text}`);
    // logToFile(`📝 Raw request body (first 100 chars): ${text ? text.substring(0, 100) : 'Empty'}...`);
    
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
        // Get the raw buffer directly from the request
        const rawBuffer = Buffer.from(await request.arrayBuffer());
        
        // Log the signature and buffer details for debugging
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
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        const subscriptionUserId = subscription.metadata?.userId;
        
        console.log(`📦 Processing subscription event for user ${subscriptionUserId}`);
        console.log(`📦 Subscription status: ${subscription.status}`);
        
        // Handle subscription events here
        // This could update the user's subscription status in your database
        // For now, we'll just log it
        
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
