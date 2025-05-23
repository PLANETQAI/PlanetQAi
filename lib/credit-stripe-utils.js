import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Credit Management System
 */
export class CreditManager {
  /**
   * Calculate credits needed based on song generation duration
   * @param {number} durationSeconds - Duration of song generation in seconds
   * @param {number} creditsPerSecond - Credits to charge per second (default: 5)
   * @returns {number} - Total credits to be deducted
   */
  static calculateCreditsForGeneration(durationSeconds, creditsPerSecond = 5) {
    // Minimum charge of 1 second
    const effectiveDuration = Math.max(1, durationSeconds);
    return Math.ceil(effectiveDuration * creditsPerSecond);
  }

  /**
   * Check if user has enough credits for an estimated duration
   * @param {string} userId - User ID
   * @param {number} estimatedDurationSeconds - Estimated duration in seconds
   * @returns {Promise<boolean>} - Whether user has enough credits
   */
  static async hasEnoughCredits(userId, estimatedDurationSeconds) {
    const creditsRequired = this.calculateCreditsForGeneration(
      estimatedDurationSeconds
    );
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    return user?.credits >= creditsRequired;
  }

  /**
   * Deduct credits from user after song generation
   * @param {string} userId - User ID
   * @param {number} durationSeconds - Actual duration of generation in seconds
   * @param {string} songId - ID of the generated song
   * @returns {Promise<{success: boolean, creditsUsed: number, remainingCredits: number}>}
   */
  static async deductCreditsForSongGeneration(userId, durationSeconds, songId) {
    // Get the song to determine which generator was used and get the prompt
    const song = await prisma.song.findUnique({
      where: { id: songId },
      select: { prompt: true, tags: true }
    });
    
    // Determine if this is a Suno or Diffrhym generation
    const isSuno = song.tags && Array.isArray(song.tags) && 
                  (song.tags.includes('provider:suno') || song.tags.includes('generator:suno'));
    
    // Count words in the prompt
    const prompt = song.prompt || '';
    const wordCount = prompt.split(/\s+/).filter(word => word.length > 0).length;
    
    let creditsToDeduct;
    
    if (isSuno) {
      // Suno credit calculation
      creditsToDeduct = 24; // Base cost
      
      // Additional cost for words over 200
      if (wordCount > 200) {
        const excessWords = wordCount - 200;
        const excessWordPacks = Math.ceil(excessWords / 10);
        creditsToDeduct += excessWordPacks * 5;
      }
      
      console.log(`Deducting ${creditsToDeduct} credits for Suno generation with ${wordCount} words`);
    } else {
      // Diffrhym credit calculation
      creditsToDeduct = 15; // Base cost
      
      // Additional cost for words over 200
      if (wordCount > 200) {
        const excessWords = wordCount - 200;
        const excessWordPacks = Math.ceil(excessWords / 10);
        creditsToDeduct += excessWordPacks * 4;
      }
      
      console.log(`Deducting ${creditsToDeduct} credits for Diffrhym generation with ${wordCount} words`);
    }

    // Use transaction to ensure data consistency
    return await prisma.$transaction(async (tx) => {
      // Get current user with credits
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true, totalCreditsUsed: true },
      });

      if (!user || user.credits < creditsToDeduct) {
        throw new Error("Insufficient credits");
      }

      // Update user credits
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          credits: { decrement: creditsToDeduct },
          totalCreditsUsed: { increment: creditsToDeduct },
        },
      });

      // Log the credit usage
      await tx.creditLog.create({
        data: {
          userId,
          amount: -creditsToDeduct,
          balanceAfter: updatedUser.credits,
          description: "Song generation",
          relatedEntityId: songId,
          relatedEntityType: "Song",
        },
      });

      // Update the song with credits used
      await tx.song.update({
        where: { id: songId },
        data: { creditsUsed: creditsToDeduct },
      });

      return {
        success: true,
        creditsUsed: creditsToDeduct,
        remainingCredits: updatedUser.credits,
      };
    });
  }

  /**
   * Add credits to user account (e.g., monthly renewal, purchase)
   * @param {string} userId - User ID
   * @param {number} credits - Credits to add
   * @param {string} description - Description of credit addition
   * @param {string} relatedEntityId - Optional related entity ID
   * @param {string} relatedEntityType - Optional related entity type
   * @returns {Promise<{success: boolean, newBalance: number}>}
   */
  static async addCredits(
    userId,
    credits,
    description,
    relatedEntityId = null,
    relatedEntityType = null
  ) {
    return await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { credits: { increment: credits } },
      });

      await tx.creditLog.create({
        data: {
          userId,
          amount: credits,
          balanceAfter: updatedUser.credits,
          description,
          relatedEntityId,
          relatedEntityType,
        },
      });

      return {
        success: true,
        newBalance: updatedUser.credits,
      };
    });
  }
}

/**
 * Stripe Payment Integration
 */
export class StripeService {
  /**
   * Create or update a Stripe customer
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @param {string} name - User name
   * @returns {Promise<string>} - Stripe customer ID
   */
  static async createOrUpdateCustomer(userId, email, name) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    let customerId = user?.stripeCustomerId;

    if (customerId) {
      // Update existing customer
      await stripe.customers.update(customerId, {
        email,
        name,
      });
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { userId },
      });

      customerId = customer.id;

      // Save Stripe customer ID to user
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    return customerId;
  }

  /**
   * Create a checkout session for subscription
   * @param {string} userId - User ID
   * @param {string} planId - Pricing plan ID
   * @param {string} successUrl - Redirect URL on success
   * @param {string} cancelUrl - Redirect URL on cancel
   * @returns {Promise<{sessionId: string, url: string}>}
   */
  static async createSubscriptionCheckout(
    userId,
    planId,
    successUrl,
    cancelUrl
  ) {
    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true, stripeCustomerId: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get the pricing plan
    const plan = await prisma.pricingPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      throw new Error("Invalid or inactive plan");
    }

    // Ensure user has a Stripe customer ID
    const customerId =
      user.stripeCustomerId ||
      (await this.createOrUpdateCustomer(userId, user.email, user.fullName));

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        metadata: {
          userId,
          planId,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planId,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Handle webhook for subscription events
   * @param {Object} event - Stripe event object
   * @returns {Promise<void>}
   */
  static async handleSubscriptionWebhook(event) {
    const subscription = event.data.object;
    const userId = subscription.metadata.userId;

    if (!userId) {
      console.error("No userId found in subscription metadata");
      return;
    }

    // Get the plan from Stripe price ID
    const plan = await prisma.pricingPlan.findFirst({
      where: { stripePriceId: subscription.items.data[0].price.id },
    });

    if (!plan) {
      console.error(
        "No matching plan found for price ID:",
        subscription.items.data[0].price.id
      );
      return;
    }

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await this.updateUserSubscription(userId, subscription, plan);
        break;

      case "customer.subscription.deleted":
        await this.cancelUserSubscription(userId, subscription);
        break;
    }
  }

  /**
   * Update user subscription details
   * @param {string} userId - User ID
   * @param {Object} stripeSubscription - Stripe subscription object
   * @param {Object} plan - Pricing plan
   * @returns {Promise<void>}
   */
  static async updateUserSubscription(userId, stripeSubscription, plan) {
    // Determine subscription status
    let status;
    if (stripeSubscription.status === "active") {
      status = "Active";
    } else if (stripeSubscription.status === "canceled") {
      status = "Canceled";
    } else if (
      stripeSubscription.status === "past_due" ||
      stripeSubscription.status === "unpaid"
    ) {
      status = "Expired";
    } else if (stripeSubscription.status === "trialing") {
      status = "Trialing";
    } else {
      status = "Paused";
    }

    // Update/create subscription record
    await prisma.subscription.upsert({
      where: { userId },
      update: {
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: stripeSubscription.items.data[0].price.id,
        planName: plan.name,
        status,
        currentPeriodStart: new Date(
          stripeSubscription.current_period_start * 1000
        ),
        currentPeriodEnd: new Date(
          stripeSubscription.current_period_end * 1000
        ),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        updatedAt: new Date(),
      },
      create: {
        userId,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: stripeSubscription.items.data[0].price.id,
        planName: plan.name,
        status,
        currentPeriodStart: new Date(
          stripeSubscription.current_period_start * 1000
        ),
        currentPeriodEnd: new Date(
          stripeSubscription.current_period_end * 1000
        ),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // New subscription or renewal - add credits
    if (
      status === "Active" &&
      (event.type === "customer.subscription.created" ||
        new Date(stripeSubscription.current_period_start * 1000) >
          new Date(Date.now() - 10 * 60 * 1000))
    ) {
      // Update user role and limits
      await prisma.user.update({
        where: { id: userId },
        data: {
          role: plan.name.toUpperCase(),
          maxMonthlyCredits: plan.credits,
          max_download: plan.maxDownloads,
        },
      });

      // Add credits for the new/renewed subscription
      await CreditManager.addCredits(
        userId,
        plan.credits,
        `${plan.name} subscription ${
          event.type === "customer.subscription.created" ? "started" : "renewed"
        }`,
        stripeSubscription.id,
        "Subscription"
      );
    }
  }

  /**
   * Cancel user subscription
   * @param {string} userId - User ID
   * @param {Object} stripeSubscription - Stripe subscription object
   * @returns {Promise<void>}
   */
  static async cancelUserSubscription(userId, stripeSubscription) {
    await prisma.subscription.update({
      where: { userId },
      data: {
        status: "Canceled",
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      },
    });

    // Don't downgrade user yet - they keep benefits until end of period
  }

  /**
   * Handle webhook for invoice events
   * @param {Object} event - Stripe event object
   * @returns {Promise<void>}
   */
  static async handleInvoiceWebhook(event) {
    const invoice = event.data.object;
    const userId =
      invoice.subscription?.metadata?.userId ||
      invoice.customer_details?.metadata?.userId;

    if (!userId) {
      console.error("No userId found in invoice metadata");
      return;
    }

    // Create payment record
    if (event.type === "invoice.paid") {
      await prisma.payment.create({
        data: {
          userId,
          stripePaymentId: invoice.payment_intent,
          amount: invoice.amount_paid / 100, // Convert from cents
          currency: invoice.currency,
          status: "succeeded",
          paymentMethod: invoice.payment_method_types?.[0] || null,
          description: `Invoice ${invoice.number}`,
          metadata: { invoiceId: invoice.id },
        },
      });
    }
  }
}

/**
 * Cron Job for Monthly Credits Renewal
 * This should run at the start of each billing cycle
 */
export async function renewMonthlyCredits() {
  // Get all active subscriptions
  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      status: "Active",
      cancelAtPeriodEnd: false,
    },
    include: {
      user: true,
    },
  });

  for (const subscription of activeSubscriptions) {
    const plan = await prisma.pricingPlan.findFirst({
      where: { stripePriceId: subscription.stripePriceId },
    });

    if (!plan) continue;

    // Add monthly credits
    await CreditManager.addCredits(
      subscription.userId,
      plan.credits,
      "Monthly credit renewal",
      subscription.id,
      "Subscription"
    );
  }
}

/**
 * Hook to track song generation and deduct credits
 * Use this function when calling your AI service to generate songs
 */
export async function generateSongWithCredits(
  userId,
  prompt,
  estimatedDuration
) {
  // Step 1: Check if user has enough credits based on estimated duration
  const hasCredits = await CreditManager.hasEnoughCredits(
    userId,
    estimatedDuration
  );
  if (!hasCredits) {
    throw new Error("Insufficient credits for estimated song duration");
  }

  // Step 2: Create initial song record
  const song = await prisma.song.create({
    data: {
      userId,
      title: prompt.substring(0, 50), // Temporary title from prompt
      prompt,
      audioUrl: "", // Will be updated after generation
      duration: 0, // Will be updated after generation
      creditsUsed: 0, // Will be updated after generation
    },
  });

  // Step 3: Call your AI service to generate the song
  // This is a placeholder - replace with your actual implementation
  try {
    const startTime = Date.now();

    // Your AI service call would go here
    // const result = await yourAIService.generateSong(prompt);

    // For demonstration, let's assume we get back these values:
    const generationResult = {
      audioUrl: `https://yourdomain.com/storage/songs/${song.id}.mp3`,
      title: "Generated Song Title",
      lyrics: "These are the generated lyrics...",
      duration: Math.floor(Math.random() * 180) + 60, // Random duration between 60-240 seconds
    };

    // Calculate actual generation time in seconds
    const actualDuration = Math.ceil((Date.now() - startTime) / 1000);

    // Step 4: Update the song with actual details
    await prisma.song.update({
      where: { id: song.id },
      data: {
        title: generationResult.title,
        lyrics: generationResult.lyrics,
        audioUrl: generationResult.audioUrl,
        duration: generationResult.duration,
      },
    });

    // Step 5: Deduct credits based on actual generation time
    await CreditManager.deductCreditsForSongGeneration(
      userId,
      actualDuration,
      song.id
    );

    return {
      success: true,
      song: await prisma.song.findUnique({ where: { id: song.id } }),
    };
  } catch (error) {
    // If generation fails, delete the song record
    await prisma.song.delete({ where: { id: song.id } });
    throw error;
  }
}
