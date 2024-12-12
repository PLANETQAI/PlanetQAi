import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'

export async function GET() {
	try {
		// Connect to the database
		const client = await connectToDatabase()
		const db = client.db()

		// Find the user with the specified email
		const usersCollection = db.collection('login')
		const user = await usersCollection.findOne({ email: 'planetqproductions@gmail.com' })
		console.log(user)

		// Check if the user exists
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 })
		}

		const clearUser = await JSON.parse(JSON.stringify(user))

		const videoLinksCollection = db.collection('videolinks')

		// Find videos uploaded by the current user
		const userVideos = await videoLinksCollection.find({ user: clearUser._id }).toArray()

		// Serialize the data to plain objects
		const serializedVideos = userVideos.map(video => ({
			...video,
			_id: video._id.toString(), // Convert ObjectId to string
		}))

		return NextResponse.json(serializedVideos)
	} catch (error) {
		console.log(error)
		return NextResponse.json({ error, message: 'Something Went Wrong' }, { status: 500 })
	}
}
