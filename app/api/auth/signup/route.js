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
		
		// Create a credit log entry for the initial credits
		await prisma.creditLog.create({
			data: {
				userId: result.id,
				amount: 50,
				balanceAfter: 50,
				description: 'Welcome bonus credits',
			},
		})
		
		console.log('User Created:', result)

		return NextResponse.json({ message: 'User Created!' }, { status: 201 })
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ message: error.errors }, { status: 422 })
		}

		console.error('Error:', error)
		return NextResponse.json({ message: 'Something went wrong!' }, { status: 500 })
	}
}
