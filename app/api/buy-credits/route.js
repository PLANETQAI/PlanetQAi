import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Define credit packages
const CREDIT_PACKAGES = [
  { id: "small", name: "Small Pack", credits: 100, price: 5 },
  { id: "medium", name: "Medium Pack", credits: 300, price: 12 },
  { id: "large", name: "Large Pack", credits: 700, price: 25 },
  { id: "xl", name: "Extra Large Pack", credits: 1500, price: 45 },
];

// GET handler to retrieve available credit packages
export async function GET(req) {
  try {
    // Get user session
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return available credit packages
    return NextResponse.json({
      success: true,
      packages: CREDIT_PACKAGES,
    });
  } catch (error) {
    console.error("Error fetching credit packages:", error);
    return NextResponse.json(
      { error: "Failed to fetch credit packages" },
      { status: 500 }
    );
  }
}

// POST handler to process credit purchase
export async function POST(req) {
  try {
    // Get user session
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { packageId } = body;

    // Validate package ID
    const selectedPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
    if (!selectedPackage) {
      return NextResponse.json(
        { error: "Invalid package selected" },
        { status: 400 }
      );
    }

    // In a real implementation, you would create a Stripe checkout session here
    // For now, we'll just add the credits directly to the user's account for testing

    // Get current user credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Add credits to user account
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: user.credits + selectedPackage.credits,
      },
    });

    // Create a credit log entry
    await prisma.creditLog.create({
      data: {
        userId,
        amount: selectedPackage.credits,
        balanceAfter: updatedUser.credits,
        description: `Purchased ${selectedPackage.name} (${selectedPackage.credits} credits)`,
      },
    });

    // In a real implementation, you would return the Stripe checkout URL
    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      message: "Credits added successfully",
      newBalance: updatedUser.credits,
      // In a real implementation: url: stripeCheckoutSession.url
    });
  } catch (error) {
    console.error("Credit purchase error:", error);
    return NextResponse.json(
      { error: "Failed to process credit purchase" },
      { status: 500 }
    );
  }
}
