import { connectToDatabase } from '@/lib/db'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export async function GET(req, res) {
	// Get session to check if user is authenticated
	const session = await auth()

	if (!session) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
	}

	try {
		// Establish database connection
		const client = await connectToDatabase()
		const db = client.db()
		const galleryCollection = db.collection('gallery')

		// Get the user's ID from the session
		const userId = session.user.id

		// Find all galleries for the authenticated user
		const galleries = await galleryCollection.find({ user: '672d3160cf61ebde5d5bd88f' }).toArray()

		// Return the found galleries
		return NextResponse.json(galleries, { status: 200 })
	} catch (error) {
		console.log('Error:', error)
		return NextResponse.json({ message: 'Internal Server Error: Unable to fetch galleries' }, { status: 500 })
	}
}
