import { connectToDatabase } from '@/lib/db'
import { NextResponse } from 'next/server'
import { signInSchema } from '@/lib/zod'
import { saltAndHashPassword } from '@/utils/password'
import { ZodError } from 'zod'

export async function POST(req, res) {
	try {
		const body = await req.json()

		// Validate the input against the schema
		const parsedData = signInSchema.parse(body)
		const { fullName, email, password } = parsedData

		const client = await connectToDatabase()
		const db = client.db()

		// Check if the user already exists
		const existingUser = await db.collection('login').findOne({ email })
		console.log(existingUser, 'existing user')
		if (existingUser) {
			client.close()
			return NextResponse.json({ message: 'User exists already!' }, { status: 422 })
		}

		// Hash the password before saving
		const hashedPassword = saltAndHashPassword(password)

		// Insert the new user into the database
		const result = await db.collection('login').insertOne({
			fullName,
			email,
			password: hashedPassword, // Save the hashed password
			max_download: 0,
			role: 'user',
			userType: 'member',
			sessionId: null,
		})

		client.close()
		return NextResponse.json({ message: 'User Created!' }, { status: 201 })
	} catch (error) {
		// Handle validation errors from Zod
		if (error instanceof ZodError) {
			return NextResponse.json({ message: error.errors }, { status: 422 })
		}

		console.log('Signup Error:', error)
		return NextResponse.json({ message: 'Something went wrong!' }, { status: 500 })
	}
}
