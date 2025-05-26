import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Using the shared Prisma instance

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, code } = body;

    if (!userId || !code) {
      return NextResponse.json({ error: 'User ID and verification code are required' }, { status: 400 });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 400 });
    }

    // Find the verification record
    const verification = await prisma.verification.findUnique({
      where: { userId: user.id },
    });

    if (!verification) {
      return NextResponse.json({ error: 'No verification request found' }, { status: 400 });
    }

    // Check if this is a signup verification
    if (verification.type !== 'SIGNUP') {
      return NextResponse.json({ error: 'Invalid verification type' }, { status: 400 });
    }

    // Check if the code is valid
    if (verification.code !== code) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Check if the code is expired
    if (verification.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }

    // Check if the code has already been used
    if (verification.isUsed) {
      return NextResponse.json({ error: 'Verification code has already been used' }, { status: 400 });
    }

    // Mark the verification as used
    await prisma.verification.update({
      where: { id: verification.id },
      data: { isUsed: true }
    });

    // Mark the user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true }
    });

    return NextResponse.json({ 
      message: 'Account verified successfully', 
      redirectUrl: verification.redirectUrl || '/aistudio'
    });
  } catch (error) {
    console.error('Verify account error:', error);
    return NextResponse.json({ error: 'Failed to verify account' }, { status: 500 });
  }
}
