import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PATCH(req, { params }) {
  try {
    // Get the session and check if the user is an admin
    const session = await auth();
    
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = params;
    const { amount, creditType = 'credits', planId } = await req.json();

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid credit amount' }, { status: 400 });
    }

    const isRadioCredits = creditType === 'radio';
    const creditField = isRadioCredits ? 'radioCredits' : 'credits';
    
    // Find the plan if it's a radio credit
    let plan = null;
    if (isRadioCredits && planId) {
      const { RADIO_SUBSCRIPTION_PLANS } = await import('@/lib/stripe_package');
      plan = RADIO_SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) {
        return NextResponse.json({ error: 'Invalid radio plan' }, { status: 400 });
      }
    }

    // First, get the current user to calculate the new balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        credits: true,
        radioCredits: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate the new balance
    const currentBalance = isRadioCredits ? user.radioCredits : user.credits;
    const newBalance = currentBalance + amount;
    const newRadioBalance = isRadioCredits ? newBalance : user.radioCredits;

    // Prepare the credit log data
    const creditLogData = {
      userId,
      amount,
      creditType: isRadioCredits ? 'radio' : 'normal',
      description: isRadioCredits 
        ? `Admin added ${amount} radio credits${plan ? ` (${plan.name} - ${plan.interval_count} month${plan.interval_count > 1 ? 's' : ''})` : ''}`
        : `Admin added ${amount} credits`,
      balanceAfter: newBalance,
      radioBalance: newRadioBalance
    };

    // Start a transaction to update user credits and create a log entry
    const result = await prisma.$transaction([
      // Update user's credits or radio credits
      prisma.user.update({
        where: { id: userId },
        data: {
          [creditField]: {
            increment: amount
          }
        },
        select: {
          id: true,
          email: true,
          credits: true,
          radioCredits: true
        }
      }),
      
      // Create a credit log entry
      prisma.creditLog.create({
        data: creditLogData
      })
    ]);

    const [updatedUser] = result;

    return NextResponse.json({
      success: true,
      message: `Successfully added ${amount} ${isRadioCredits ? 'radio ' : ''}credits to ${updatedUser.email}${plan ? ` (${plan.name})` : ''}`,
      creditType: isRadioCredits ? 'radio' : 'regular',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user credits:', error);
    return NextResponse.json(
      { error: 'Failed to update user credits' },
      { status: 500 }
    );
  }
}
