import { NextResponse } from 'next/server'
import { signInSchema } from '@/lib/zod'
import { saltAndHashPassword } from '@/utils/password'
import { ZodError } from 'zod'
import prisma from '@/lib/prisma'
import crypto from 'crypto'
import { sendEmail } from '@/utils/email/emailService'
import { accountVerificationTemplate } from '@/utils/email/emailTemplates'

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
		const body = await req.json()
		console.log('Request Body:', body)

		// Extract only the essential fields
		const { fullName, email, password } = body
		
		// Basic validation
		if (!fullName || !email || !password) {
			return NextResponse.json({ message: 'All fields are required' }, { status: 422 })
		}
		
		// Simple email validation
		if (!email.includes('@')) {
			return NextResponse.json({ message: 'Invalid email format' }, { status: 422 })
		}

		// Check if the user already exists
		const existingUser = await prisma.user.findUnique({ 
			where: { email },
			select: { id: true, email: true, isVerified: true, fullName: true }
		})
		console.log('Existing User:', existingUser)
		
		if (existingUser) {
			// If user exists but is not verified, we can resend verification
			if (!existingUser.isVerified) {
				// Generate a new verification code and token
				const verificationCode = generateVerificationCode();
				const verificationToken = generateToken();
				const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
				
				// Update the existing verification record or create a new one
				await prisma.verification.upsert({
					where: { userId: existingUser.id },
					update: {
						code: verificationCode,
						token: verificationToken,
						expiresAt: expiresAt,
						isUsed: false,
						redirectUrl: body.redirectUrl || '/aistudio',
					},
					create: {
						userId: existingUser.id,
						code: verificationCode,
						token: verificationToken,
						type: 'SIGNUP',
						expiresAt: expiresAt,
						redirectUrl: body.redirectUrl || '/aistudio',
					},
				});
				
				// Get user details for email
				const userDetails = await prisma.user.findUnique({
					where: { id: existingUser.id },
					select: { fullName: true, email: true }
				});
				
				// Generate email template
				const { html, text } = accountVerificationTemplate(userDetails.fullName, verificationToken, existingUser.id, verificationCode);
				
				// Send verification email
				try {
					await sendEmail(
						userDetails.email,
						'Verify Your PlanetQAi Account',
						html,
						text
					);
					console.log(`Verification email resent to ${userDetails.email}`);
				} catch (emailError) {
					console.error('Error sending verification email:', emailError);
				}
				
				// For development purposes, log verification details
				if (process.env.NODE_ENV === 'development') {
					console.log('Verification code:', verificationCode);
					console.log('Verification token:', verificationToken);
					console.log(`Verification link: ${process.env.NEXT_PUBLIC_APP_URL}/verify-account?token=${verificationToken}&userId=${existingUser.id}`);
				}
				
				return NextResponse.json({ 
					message: 'We noticed you already have an account. A new verification email has been sent.',
					userId: existingUser.id,
					email: userDetails.email,
					verificationCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined,
					verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
				}, { status: 200 });
			}
			
			// If user is already verified, return error
			return NextResponse.json({ message: 'User exists already! Please login instead.' }, { status: 422 })
		}

		// Hash the password before saving
		const hashedPassword = saltAndHashPassword(password)

		if (!hashedPassword) {
			throw new Error('Password hashing failed')
		}

		// Get the redirectUrl if provided, or default to home
		const redirectUrl = body.redirectUrl || '/aistudio';

		// Create the new user in the database
		const result = await prisma.user.create({
			data: {
				fullName,
				email,
				password: hashedPassword,
				role: 'Basic',
				isVerified: false, // User starts as unverified
				credits: 50, // Initial credits as per requirements
			},
		});
		
		// Create a credit log entry for the initial credits
		await prisma.creditLog.create({
			data: {
				userId: result.id,
				amount: 50,
				balanceAfter: 50,
				description: 'Welcome bonus credits',
			},
		});

		// Generate a verification code and token
		const verificationCode = generateVerificationCode();
		const verificationToken = generateToken();
		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

		// Create a verification record
		await prisma.verification.create({
			data: {
				userId: result.id,
				code: verificationCode,
				token: verificationToken,
				type: 'SIGNUP',
				expiresAt: expiresAt,
				redirectUrl: redirectUrl,
			},
		});

		console.log('User Created:', result);
		
		// Generate email template
		const { html, text } = accountVerificationTemplate(fullName, verificationToken, result.id, verificationCode);
		
		// Send verification email
		try {
			await sendEmail(
				result.email,
				'Verify Your PlanetQAi Account',
				html,
				text
			);
			console.log(`Verification email sent to ${result.email}`);
		} catch (emailError) {
			console.error('Error sending verification email:', emailError);
			// Continue execution even if email fails - we'll show the code in development mode
		}
		
		// For development purposes, log verification details
		if (process.env.NODE_ENV === 'development') {
			console.log('Verification code:', verificationCode);
			console.log('Verification token:', verificationToken);
			console.log(`Verification link: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-account?token=${verificationToken}&userId=${result.id}`);
		}

		return NextResponse.json({ 
			message: 'User created! Please check your email to verify your account.', 
			userId: result.id,
			email: result.email,
			// Only include the verification details in development
			verificationCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined,
			verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
		}, { status: 201 })
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ message: error.errors }, { status: 422 })
		}

		// Log detailed error information for debugging
		console.error('Signup Error:', {
			message: error.message,
			code: error.code,
			meta: error.meta,
			stack: error.stack
		})
		
		// Handle specific Prisma errors with user-friendly messages
		if (error.code === 'P2022') {
			return NextResponse.json({ 
				message: 'We\'re experiencing technical difficulties with our user registration system.', 
				detail: 'Our team has been notified. Please try again later.' 
			}, { status: 500 })
		}
		
		// Handle database connection errors (like the URL format issue)
		if (error.code === 'P6001' || error.message.includes('URL must start with the protocol')) {
			return NextResponse.json({ 
				message: 'We\'re currently experiencing database connectivity issues.', 
				detail: 'Our team has been notified. Please try again later or contact support if the issue persists.' 
			}, { status: 503 })
		}
		
		// Handle duplicate email error more gracefully
		if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
			return NextResponse.json({ 
				message: 'This email is already registered.', 
				detail: 'Please use a different email address or try logging in instead.' 
			}, { status: 409 })
		}
		
		// Generic error for all other cases
		return NextResponse.json({ 
			message: 'Registration failed. Please try again later.', 
			detail: 'If this issue persists, please contact our support team.'
		}, { status: 500 })
	}
}
