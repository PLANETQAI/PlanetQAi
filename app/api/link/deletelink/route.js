import { connectToDatabase } from '@/lib/db'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function DELETE(req, res) {
	const session = await auth()

	// Check if the user is authenticated
	if (!session) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
	}

	// Check if the user is an admin
	const isAdmin = session.user.role === 'admin'
	if (!isAdmin) {
		return NextResponse.json({ message: 'Forbidden: You do not have permission to perform this action' }, { status: 403 })
	}

	const { songId } = req.body

	if (!songId) {
		return NextResponse.json({ message: 'Bad Request: songId is required' }, { status: 400 })
	}

	try {
		const client = await connectToDatabase()
		const linkCollection = client.db().collection('videolinks')

		const result = await linkCollection.deleteOne({ _id: new ObjectId(songId) })

		if (result.deletedCount === 0) {
			return NextResponse.json({ message: 'Song not found' }, { status: 404 })
		}

		return NextResponse.json({ message: 'Successfully deleted the song' }, { status: 200 })
	} catch (error) {
		return NextResponse.json({ message: 'Internal Server Error: Unable to delete the song' }, { status: 500 })
	}
}
