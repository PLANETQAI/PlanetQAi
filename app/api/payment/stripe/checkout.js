import { StripeService } from "@/lib/credit-stripe-utils";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({ error: "Plan ID is required" });
    }

    // Verify plan exists
    const plan = await prisma.pricingPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      return res.status(400).json({ error: "Invalid or inactive plan" });
    }

    // Get base URL for success and cancel URLs
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`;

    const successUrl = `${baseUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/subscribe/cancel`;

    // Create checkout session
    const { sessionId, url } = await StripeService.createSubscriptionCheckout(
      session.user.id,
      planId,
      successUrl,
      cancelUrl
    );

    res.status(200).json({ sessionId, url });
  } catch (error) {
    console.error("Create checkout error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
}
