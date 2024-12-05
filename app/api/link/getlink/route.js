import { connectToDatabase } from '@/lib/db'
import { ObjectId } from 'mongodb'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export async function GET(req, res) {
	try {
		const client = await connectToDatabase()
		const db = client.db()
		const videoLinksCollection = db.collection('videolinks')
		const usersCollection = db.collection('login')

		// Get session to check if user is authenticated
		const session = await auth()

		// Fetch all video links
		let videoLinks
		if (session) {
			const isAdmin = session.user.role === 'admin'
			//console.log(session);
			//console.log(session.user.role);
			if (isAdmin) {
				videoLinks = await videoLinksCollection.find({}).toArray()
			} else {
				videoLinks = await videoLinksCollection.find({ status: 'active' }).toArray()
			}
		} else {
			videoLinks = await videoLinksCollection.find({ status: 'active' }).toArray()
		}

		const populatedVideoLinks = await Promise.all(
			videoLinks.map(async videoLink => {
				const user = await usersCollection.findOne({ _id: new ObjectId(videoLink.user) })

				if (user) {
					const { password, ...userWithoutPassword } = user

					return {
						...videoLink,
						user: userWithoutPassword,
					}
				}

				return videoLink
			})
		)

		return NextResponse.json(populatedVideoLinks)
	} catch (error) {
		console.log('Error:', error)
		return NextResponse.json({ message: 'Internal Server Error: Unable to get music' }, { status: 500 })
	}
}
