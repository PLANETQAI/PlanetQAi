import { NextResponse } from 'next/server'
import { signInSchema } from '@/lib/zod'
import { saltAndHashPassword } from '@/utils/password'
import { ZodError } from 'zod'
import prisma from '@/lib/prisma'

export async function POST(req) {
	try {
		const body = await req.json()
		console.log('Request Body:', body)

		// TEMPORARY: Skip strict validation for testing
		// const parsedData = signInSchema.parse(body)
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
		const existingUser = await prisma.user.findUnique({ where: { email } })
		console.log('Existing User:', existingUser)
		if (existingUser) {
			return NextResponse.json({ message: 'User exists already!' }, { status: 422 })
		}

		// Hash the password before saving
		const hashedPassword = saltAndHashPassword(password)

		if (!hashedPassword) {
			throw new Error('Password hashing failed')
		}

		// Create the new user in the database with default 50 credits
		const result = await prisma.user.create({
			data: {
				fullName,
				email,
				password: hashedPassword, // Save the hashed password
				credits: 50, // Give new users 50 credits by default
			},
		})
		
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
