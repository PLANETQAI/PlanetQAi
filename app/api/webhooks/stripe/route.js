import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';
import { headers } from 'next/headers';

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

// Disable auth requirement for this route
export const dynamic = 'force-dynamic';

// This is needed to disable the default body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  logToFile(`🔔 Webhook received at ${new Date().toISOString()}`);
  
  try {
    // Get the raw request body as a string
    const body = await req.text();
    
    // Get headers using the next/headers API
    const headersList = headers();
    const signature = headersList.get('stripe-signature');
    
    // Log headers for debugging
    const headersObj = {};
    headersList.forEach((value, key) => {
      headersObj[key] = value;
    });
    
    logToFile(`📝 Request headers: ${JSON.stringify(headersObj)}`);
    logToFile(`🔑 Webhook signature: ${signature}`);
    logToFile(`📝 Webhook secret: ${webhookSecret ? 'Present (not showing for security)' : 'Missing!'}`);
    
    // Log the raw body for debugging
    logToFile(`📝 Raw request body (first 200 chars): ${body.substring(0, 200)}...`);
    
    let event;
    try {
      if (!webhookSecret) {
        logToFile(`⚠️ No webhook secret found in environment variables!`, true);
        // For testing, parse the event directly
        event = JSON.parse(body);
        logToFile(`⚠️ Using parsed event without signature verification (INSECURE)`);
      } else {
        // Use the raw body and signature to construct the event
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logToFile(`✅ Webhook signature verified successfully`);
      }
      
      logToFile(`📦 Event type: ${event.type}`);
      logToFile(`📦 Event ID: ${event.id}`);
    } catch (err) {
      logToFile(`⚠️ Webhook signature verification failed: ${err.message}`, true);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    // Log the full event data for debugging
    logToFile(`📄 Full event data: ${JSON.stringify(event.data.object, null, 2)}`);

    // Handle the event
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
          return NextResponse.json({ received: true });
        }
        
        if (!userId || !creditsToAdd) {
          logToFile(`❌ Missing required metadata in Stripe session. userId: ${userId}, credits: ${creditsToAdd}`, true);
          return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
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
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
    return NextResponse.json({ received: true });
  } catch (error) {
    logToFile(`❌ Webhook error: ${error.message}`, true);
    logToFile(`Stack trace: ${error.stack}`, true);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
