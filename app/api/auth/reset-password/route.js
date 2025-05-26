import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Using the shared Prisma instance
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    console.log('Reset password request received');
    const body = await req.json();
    const { email, code, newPassword, userId } = body;

    console.log('Reset password request:', { email, userId });

    // We can reset password using either email or userId
    if ((!email && !userId) || !code || !newPassword) {
      return NextResponse.json({ error: 'Email/userId, verification code, and new password are required' }, { status: 400 });
    }

    // Validate password
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    // Find the user
    let user;
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
    const verification = await prisma.verification.findUnique({
      where: { userId: user.id },
    });

    if (!verification) {
      return NextResponse.json({ error: 'No verification request found' }, { status: 400 });
    }

    // Check if this is a password reset verification
    if (verification.type !== 'PASSWORD_RESET') {
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

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Mark the verification code as used
    await prisma.verification.update({
      where: { userId: user.id },
      data: { isUsed: true },
    });

    return NextResponse.json({ 
      message: 'Password reset successfully',
      redirectUrl: verification.redirectUrl || '/login'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
