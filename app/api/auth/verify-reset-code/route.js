import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Using the shared Prisma instance

export async function POST(req) {
  try {
    console.log('Verify reset code request received');
    const body = await req.json();
    const { email, code, userId, token } = body;

    console.log('Verification request:', { email, userId, token: token ? '[PRESENT]' : '[NOT PROVIDED]' });

    // We can verify using email, userId, token, or code
    if ((!email && !userId && !token) || (!code && !token)) {
      return NextResponse.json({ 
        error: 'Verification requires either: (1) email/userId and code, or (2) token' 
      }, { status: 400 });
    }

    let user;
    let verification;

    // If token is provided, find verification by token
    if (token) {
      verification = await prisma.verification.findFirst({
        where: { token },
        include: { user: true }
      });

      if (verification) {
        user = verification.user;
      }
    } else {
      // Find the user
      if (email) {
        user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
      } else if (userId) {
        user = await prisma.user.findUnique({
          where: { id: userId },
        });
      }

      if (!user) {
        return NextResponse.json({ error: 'Invalid user or verification code' }, { status: 400 });
      }

      // Find the verification record
      verification = await prisma.verification.findUnique({
        where: { userId: user.id },
      });
    }

    if (!verification) {
      return NextResponse.json({ error: 'No verification request found' }, { status: 400 });
    }

    // If code is provided, check if it matches
    if (code && verification.code !== code) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Check if the verification is expired
    if (verification.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Verification has expired' }, { status: 400 });
    }

    // Check if the verification has already been used
    if (verification.isUsed) {
      return NextResponse.json({ error: 'Verification has already been used' }, { status: 400 });
    }

    // Mark the verification as used
    await prisma.verification.update({
      where: { id: verification.id },
      data: { isUsed: true }
    });

    // If this is a signup verification, mark the user as verified
    if (verification.type === 'SIGNUP') {
      await prisma.user.update({
        where: { id: verification.userId },
        data: { isVerified: true }
      });
    }

    // Verification is valid
    return NextResponse.json({ 
      message: 'Verification is valid', 
      userId: verification.userId,
      type: verification.type,
      redirectUrl: verification.redirectUrl || '/login'
    });
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json({ error: 'Failed to verify code' }, { status: 500 });
  }
}
