import { auth } from '@/auth'
import { connectToDatabase } from '@/lib/db'
import { NextResponse } from 'next/server'
const { ObjectId } = require('mongodb')

export async function DELETE(req, { params }) {
	const { id } = await params

	if (!id) {
		return NextResponse.json({ message: 'ID is required' }, { status: 400 })
	}

	try {
		// Establish database connection
		const client = await connectToDatabase()
		const db = client.db()
		const galleryCollection = db.collection('gallery')

		// Get session to check if user is authenticated
		const session = await auth()

		if (!session) {
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
		}

		// Get the user's ID from the session
		const userId = session.user.id

		// Delete the song with the specified ID for the authenticated user
		const result = await galleryCollection.deleteOne({ _id: new ObjectId(id), user: userId })

		if (result.deletedCount === 0) {
			return NextResponse.json({ message: 'Song not found or not authorized to delete' }, { status: 404 })
		}

		// Return a success response
		return NextResponse.json({ message: 'Song deleted successfully' }, { status: 200 })
	} catch (error) {
		console.log('Error:', error)
		return NextResponse.json({ message: 'Internal Server Error: Unable to delete song' }, { status: 500 })
	}
}
