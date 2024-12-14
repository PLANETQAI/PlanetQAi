import prisma from '@/lib/prisma' // Assuming prisma is set up in this file
import { NextResponse } from 'next/server'

export async function GET(req, { params }) {
	const { id } = params

	// Validate the user ID
	if (!id || isNaN(parseInt(id))) {
		return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 })
	}

	try {
		// Fetch the user from the database
		const user = await prisma.user.findUnique({
			where: { id: parseInt(id) }, // Assuming the user ID is an integer
		})

		if (!user) {
			return NextResponse.json({ message: 'User not found' }, { status: 404 })
		}

		// Exclude the password from the response
		const { password, ...userWithoutPassword } = user

		return NextResponse.json({ user: userWithoutPassword })
	} catch (error) {
		console.log('Failed to fetch user:', error)
		return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
	}
}
