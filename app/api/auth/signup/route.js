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

		// Log detailed error information
		console.error('Signup Error:', {
			message: error.message,
			code: error.code,
			meta: error.meta,
			stack: error.stack
		})
		
		// Handle specific Prisma errors
		if (error.code === 'P2022') {
			return NextResponse.json({ 
				message: 'Database schema mismatch. Please contact support.', 
				detail: 'Missing column in database schema' 
			}, { status: 500 })
		}
		
		// Return a more specific error message if possible
		return NextResponse.json({ 
			message: 'Registration failed. Please try again later.', 
			detail: error.message || 'Unknown error'
		}, { status: 500 })
	}
}
