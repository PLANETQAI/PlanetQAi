import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { sendEmail } from '@/utils/email/emailService';
import { accountVerificationTemplate } from '@/utils/email/emailTemplates';

// Function to generate a random 6-digit code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Function to generate a secure token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, userId } = body;
    
    console.log('Resend verification request:', { email, userId });
    
    // We need either email or userId to proceed
    if (!email && !userId) {
      return NextResponse.json({ error: 'Email or userId is required' }, { status: 400 });
    }
    
    // Find the user
    const user = await prisma.user.findFirst({
      where: {
        ...(email ? { email: email.toLowerCase() } : {}),
        ...(userId ? { id: userId } : {}),
      },
    });
    
    if (!user) {
      // For security reasons, don't reveal that the user doesn't exist
      return NextResponse.json({ 
        message: 'If your email is registered, a new verification code will be sent' 
      });
    }
    
    // Check if user is already verified
    if (user.isVerified) {
      return NextResponse.json({ 
        message: 'Your account is already verified. Please login.',
        alreadyVerified: true
      });
    }
    
    // Generate a new verification code and token
    const verificationCode = generateVerificationCode();
    const verificationToken = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    // Get any existing verification record
    const existingVerification = await prisma.verification.findFirst({
      where: { 
        userId: user.id,
        type: 'SIGNUP'
      },
    });
    
    // Update or create a verification record
    if (existingVerification) {
      await prisma.verification.update({
        where: { id: existingVerification.id },
        data: {
          code: verificationCode,
          token: verificationToken,
          expiresAt: expiresAt,
          isUsed: false,
        },
      });
    } else {
      await prisma.verification.create({
        data: {
          userId: user.id,
          code: verificationCode,
          token: verificationToken,
          type: 'SIGNUP',
          expiresAt: expiresAt,
          redirectUrl: '/aistudio', // Default redirect
        },
      });
    }
    
    // Generate email template
    const { html, text } = accountVerificationTemplate(user.fullName, verificationToken, user.id, verificationCode);
    
    // Send verification email
    try {
      await sendEmail(
        user.email,
        'Verify Your PlanetQAi Account',
        html,
        text
      );
      console.log(`Verification email resent to ${user.email}`);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Continue execution even if email fails - we'll show the code in development mode
    }
    
    // For development purposes, log verification details
    if (process.env.NODE_ENV === 'development') {
      console.log('Verification code:', verificationCode);
      console.log('Verification token:', verificationToken);
      console.log(`Verification link: ${process.env.NEXT_PUBLIC_APP_URL}/verify-account?token=${verificationToken}&userId=${user.id}`);
    }
    
    return NextResponse.json({ 
      message: 'Verification email has been resent. Please check your inbox.',
      userId: user.id,
      email: user.email,
      // Only include the verification details in development
      verificationCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined,
      verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ error: 'Failed to resend verification email' }, { status: 500 });
  }
}
