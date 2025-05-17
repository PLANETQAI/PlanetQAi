import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    });

    if (!subscription) {
      return res.status(200).json(null); // No subscription found
    }

    // Get user credit balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true, maxMonthlyCredits: true, totalCreditsUsed: true }
    });

    // Return combined subscription and credit information
    res.status(200).json({
      ...subscription,
      credits: user.credits,
      maxMonthlyCredits: user.maxMonthlyCredits,
      totalCreditsUsed: user.totalCreditsUsed
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription information' });
  }
}