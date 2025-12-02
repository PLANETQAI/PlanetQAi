import prisma from '@/lib/prisma'
import { logInSchema } from '@/lib/zod'
import { compare } from 'bcryptjs'
import { SignJWT } from 'jose'
import { NextResponse } from 'next/server'

export async function POST(req) {
	try {
		const body = await req.json()
		const { email, password } = logInSchema.parse(body)

		// Find the user in the database
		const user = await prisma.user.findUnique({
			where: { email: email },
		})

		if (!user) {
			return NextResponse.json({ error: 'User does not exist with this email.' }, { status: 404 })
		}

		// Check for suspension or verification status
		if (user.isSuspended && user.role !== 'Admin') {
			return NextResponse.json({ error: 'Your account has been suspended.' }, { status: 403 })
		}

		if (!user.isVerified && user.role !== 'Admin') {
			return NextResponse.json({ error: 'Please verify your email before logging in.' }, { status: 403 })
		}

		// Validate the password
		const isPasswordValid = await compare(password, user.password)
		if (!isPasswordValid) {
			return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
		}

		// --- Create the JWT ---
		const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
		if (!process.env.AUTH_SECRET) {
			throw new Error('AUTH_SECRET is not defined or is too short (must be at least 32 characters).')
		}

		const alg = 'HS256'

		// The payload will be similar to your NextAuth jwt callback
		const tokenPayload = {
			id: user.id,
			email: user.email,
			role: user.role,
			fullName: user.fullName,
			isVerified: user.isVerified,
			credits: user.credits,
			// Add any other non-sensitive user data you need
		}

		const jwt = await new SignJWT(tokenPayload)
			.setProtectedHeader({ alg })
			.setIssuedAt()
			.setIssuer('urn:planetqai:api') // A unique issuer name for your API
			.setAudience('urn:planetqai:api:client') // A unique audience name
			.setExpirationTime('24h') // Token expiration time
			.sign(secret)

		// Update last login time (optional, but good practice)
		await prisma.user.update({
			where: { id: user.id },
			data: { lastLoginAt: new Date() },
		}).catch(err => {
			console.error('Failed to update last login time during token generation:', err)
		})

		return NextResponse.json({ token: jwt })
	} catch (error) {
		if (error.name === 'ZodError') {
			return NextResponse.json({ error: 'Invalid input.', details: error.errors }, { status: 400 })
		}
		console.error('API Token Error:', error)
		return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 })
	}
}
