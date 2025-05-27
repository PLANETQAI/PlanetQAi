import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import fs from 'fs';
import path from 'path';

// Initialize Prisma and Stripe
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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
    
    // Verify the webhook signature
    let event;
    try {
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
            select: { credits: true, email: true },
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
        } catch (dbError) {
          logToFile(`❌ Database error while processing webhook: ${dbError.message}`, true);
          logToFile(`Stack trace: ${dbError.stack}`, true);
          throw dbError;
        }
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
