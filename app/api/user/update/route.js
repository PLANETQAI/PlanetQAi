import { connectToDatabase } from '@/lib/db'
import { saltAndHashPassword } from '@/utils/password'
import { signInSchema } from '@/lib/zod'
import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { auth } from '@/auth'

export async function POST(req) {
	// Get session to find the logged-in user
	const session = await auth()
	if (!session) {
		return NextResponse.json({ message: 'Unauthorized' })
	}

	const { max_download, userId } = req.body
	if (max_download < 0) {
		return NextResponse.json({ message: 'Invalid max_download value' }, { status: 400 })
	}

	try {
		const client = await connectToDatabase()
		const usersCollection = client.db().collection('login')

		// Update max_download in the database
		const result = await usersCollection.updateOne({ _id: new ObjectId(userId) }, { $set: { max_download: Number(max_download) } })

		if (result.matchedCount === 0) {
			return NextResponse.json({ message: 'User not found' }, { status: 404 })
		}

		// Optionally, you could return the updated user data
		const updatedUser = await usersCollection.findOne({
			_id: new ObjectId(userId),
		})

		// Update the session using the NextAuth update() function on the client-side later
		return NextResponse.json({ message: 'User max_download updated successfully', user: updatedUser }, { status: 200 })
	} catch (error) {
		console.log('Error updating user max_download:', error)
		return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
	}
}
