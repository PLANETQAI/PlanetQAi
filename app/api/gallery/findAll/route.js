import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export async function GET(req, res) {
	// Get session to check if user is authenticated
	const session = await auth()

	if (!session) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
	}

	try {
		// Get the user's ID from the session
		const userId = session.user.id

		// Find all galleries for the authenticated user
		const galleries = await prisma.gallery.findMany({
			where: { user: userId },
		})

		// Return the found galleries
		return NextResponse.json(galleries, { status: 200 })
	} catch (error) {
		console.error('Error fetching galleries:', error)
		return NextResponse.json(
			{ message: 'Internal Server Error: Unable to fetch galleries' },
			{ status: 500 }
		)
	}
}
