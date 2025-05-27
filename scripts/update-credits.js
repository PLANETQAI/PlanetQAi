/**
 * Script to update user credits for testing purposes
 * 
 * Usage:
 * node scripts/update-credits.js --email user@example.com --credits 100
 * OR
 * node scripts/update-credits.js --userId clm5g7n4p0003mhef1234abcd --credits -50
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const params = {};

for (let i = 0; i < args.length; i += 2) {
  if (args[i].startsWith('--')) {
    const key = args[i].slice(2);
    const value = args[i + 1];
    params[key] = value;
  }
}

// Validate required parameters
if (!params.email && !params.userId) {
  console.error('Error: Either --email or --userId is required');
  process.exit(1);
}

if (!params.credits) {
  console.error('Error: --credits parameter is required');
  process.exit(1);
}

// Convert credits to number
const credits = parseInt(params.credits, 10);
if (isNaN(credits)) {
  console.error('Error: Credits must be a valid number');
  process.exit(1);
}

async function updateCredits() {
  try {
    // Find the user
    const user = await prisma.user.findFirst({
      where: {
        ...(params.userId ? { id: params.userId } : {}),
        ...(params.email ? { email: params.email.toLowerCase() } : {}),
      },
      select: { id: true, email: true, credits: true },
    });

    if (!user) {
      console.error('Error: User not found');
      process.exit(1);
    }

    console.log(`Found user: ${user.email} (${user.id})`);
    console.log(`Current credits: ${user.credits}`);
    console.log(`Adjusting by: ${credits > 0 ? '+' : ''}${credits} credits`);

    // Use a transaction to update credits and log the change
    const result = await prisma.$transaction(async (tx) => {
      // Update user credits
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          credits: {
            ...(credits >= 0
              ? { increment: credits }
              : { decrement: Math.min(Math.abs(credits), user.credits) }),
          },
          // Only increment totalCreditsUsed if we're decrementing credits (negative value)
          ...(credits < 0
            ? {
                totalCreditsUsed: {
                  increment: Math.min(Math.abs(credits), user.credits),
                },
              }
            : {}),
        },
      });

      // Log the credit change
      await tx.creditLog.create({
        data: {
          userId: user.id,
          amount: credits,
          balanceAfter: updatedUser.credits,
          description: params.description || "Manual credit adjustment for testing",
          relatedEntityType: "AdminAdjustment",
        },
      });

      return updatedUser;
    });

    console.log(`Credits updated successfully!`);
    console.log(`New credit balance: ${result.credits}`);
    
  } catch (error) {
    console.error('Error updating credits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCredits();
