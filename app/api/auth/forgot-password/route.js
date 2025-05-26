import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Using the shared Prisma instance
import crypto from 'crypto';
import { sendEmail } from '@/utils/email/emailService';
import { passwordResetTemplate } from '@/utils/email/emailTemplates';

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
    console.log('Forgot password request received');
    const body = await req.json();
    const { email, redirectUrl } = body;
    
    console.log('Request body:', { email, redirectUrl: redirectUrl || '/login' });

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // For security reasons, don't reveal that the user doesn't exist
      return NextResponse.json({ message: 'If your email is registered, you will receive reset instructions' });
    }

    // Generate a verification code and token
    const verificationCode = generateVerificationCode();
    const verificationToken = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    // Store the verification code and token in the database
    await prisma.verification.upsert({
      where: { userId: user.id },
      update: {
        code: verificationCode,
        token: verificationToken,
        type: 'PASSWORD_RESET',
        expiresAt: expiresAt,
        isUsed: false,
        redirectUrl: redirectUrl || '/login',
      },
      create: {
        userId: user.id,
        code: verificationCode,
        token: verificationToken,
        type: 'PASSWORD_RESET',
        expiresAt: expiresAt,
        redirectUrl: redirectUrl || '/login',
      },
    });

    // Generate email template
    const { html, text } = passwordResetTemplate(user.fullName, verificationToken, user.id);
    
    // Send email
    try {
      await sendEmail(
        user.email,
        'Reset Your PlanetQAi Password',
        html,
        text
      );
      console.log(`Password reset email sent to ${email}`);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      // Continue execution even if email fails - we'll show the code in development mode
    }

    // For development purposes, log the verification code and token
    if (process.env.NODE_ENV === 'development') {
      console.log(`Password reset code for ${email}: ${verificationCode}`);
      console.log(`Password reset token: ${verificationToken}`);
      console.log(`Reset link: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${verificationToken}&userId=${user.id}`);
    }

    return NextResponse.json({ 
      message: 'If your email is registered, you will receive reset instructions',
      userId: user.id,
      email: user.email,
      // For development only, remove in production
      verificationCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined,
      verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
