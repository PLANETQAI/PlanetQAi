import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function DELETE(req, { params }) {
  try {
    // Get the session and check if the user is an admin
    const session = await auth();
    
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = params;

    // Start a transaction to update user and create a log entry
    const result = await prisma.$transaction([
      // Update user's radio subscription details
      prisma.user.update({
        where: { id: userId },
        data: {
          radioSubscriptionExpiresAt: null,
          isRadioSubscribed: false,
          lastRadioCreditUpdate: null,
          radioCredits: 0
        },
        select: {
          id: true,
          email: true,
          radioCredits: true,
          isRadioSubscribed: true
        }
      }),
      
      // Create a credit log entry for the subscription removal
      prisma.creditLog.create({
        data: {
          userId,
          amount: 0, // No credits added/removed, just clearing the subscription
          creditType: 'radio',
          description: 'Radio subscription removed by admin',
          balanceAfter: 0, // Set to 0 since we're clearing radio credits
          radioBalance: 0
        }
      })
    ]);

    const [updatedUser] = result;

    return NextResponse.json({
      success: true,
      message: `Successfully removed radio subscription from ${updatedUser.email}`,
      user: updatedUser
    });

  } catch (error) {
    console.error('Error removing radio subscription:', error);
    return NextResponse.json(
      { error: 'Failed to remove radio subscription' },
      { status: 500 }
    );
  }
}
