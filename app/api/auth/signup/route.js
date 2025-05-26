import { NextResponse } from 'next/server'
import { signInSchema } from '@/lib/zod'
import { saltAndHashPassword } from '@/utils/password'
import { ZodError } from 'zod'
import prisma from '@/lib/prisma'

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
			select: { email: true }
		})
		console.log('Existing User:', existingUser)
		
		if (existingUser) {
			return NextResponse.json({ message: 'User exists already!' }, { status: 422 })
		}

		// Hash the password before saving
		const hashedPassword = saltAndHashPassword(password)

		if (!hashedPassword) {
			throw new Error('Password hashing failed')
		}

		// Create the new user in the database with a try-catch to handle schema differences
		let result;
		try {
			// First try with credits field (for when the migration has been applied)
			result = await prisma.user.create({
				data: {
					fullName,
					email,
					password: hashedPassword,
					role: 'Basic',
					credits: 50, // Initial credits
				},
			});
		} catch (createError) {
			// If the credits field doesn't exist yet, try without it
			if (createError.code === 'P2022') {
				console.log('Credits field not found in schema, creating user without credits');
				result = await prisma.user.create({
					data: {
						fullName,
						email,
						password: hashedPassword,
						role: 'Basic',
					},
				});
			} else {
				// If it's a different error, rethrow it
				throw createError;
			}
		}
		
		// Create a credit log entry for the initial credits with error handling
		try {
			await prisma.creditLog.create({
				data: {
					userId: result.id,
					amount: 50,
					balanceAfter: 50,
					description: 'Welcome bonus credits',
				},
			});
			console.log('Credit log created successfully for user:', result.id);
		} catch (creditLogError) {
			// Log the error but don't fail the signup process
			console.error('Failed to create credit log, but user was created:', {
				userId: result.id,
				error: creditLogError.message,
				code: creditLogError.code
			});
			// We'll continue the signup process even if credit log creation fails
		}
		
		console.log('User Created:', result)

		return NextResponse.json({ message: 'User Created!' }, { status: 201 })
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
