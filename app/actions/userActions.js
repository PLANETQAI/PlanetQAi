'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function addCredits(userId, amount) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'Admin') {
      throw new Error('Unauthorized');
    }

    const result = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { 
          credits: { increment: amount } 
        },
        select: {
          id: true,
          credits: true,
          fullName: true
        }
      }),
      prisma.creditLog.create({
        data: {
          userId,
          amount: amount,
          balanceAfter: { increment: amount },
          description: 'Credits added by admin',
        },
      }),
    ]);

    return {
      success: true,
      user: result[0],
      message: `Added ${amount} credits to ${result[0].fullName}`
    };
  } catch (error) {
    console.error('Error adding credits:', error);
    return {
      success: false,
      error: error.message || 'Failed to add credits'
    };
  }
}
