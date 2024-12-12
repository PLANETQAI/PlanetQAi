import React from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { connectToDatabase } from '@/lib/db'
import Player from './player'

export const metadata = {
	title: 'PlanetQRadio',
	description: 'Welcome to PlanetQRadio Studio. Upload your music video here.',
}

const page = async () => {
	const session = await auth()

	if (session.user.email !== 'planetqproductions@gmail.com') {
		redirect('/')
	}

	// Connect to the database
	const client = await connectToDatabase()
	const db = client.db()
	const videoLinksCollection = db.collection('videolinks')

	// Find videos uploaded by the current user
	const userVideos = await videoLinksCollection.find({ user: session.user.id }).toArray()

	// Serialize the data to plain objects
	const serializedVideos = userVideos.map(video => ({
		...video,
		_id: video._id.toString(), // Convert ObjectId to string
	}))

	console.log(serializedVideos)

	const backgroundImageStyle = {
		backgroundImage: 'url("/images/back.png")',
		backgroundSize: 'cover',
		backgroundRepeat: 'no-repeat',
		backgroundPosition: 'center',
		minHeight: '100vh',
	}

	return (
		<div style={backgroundImageStyle}>
			<div className="container mx-auto px-4 py-8">
				<h1 className="text-3xl font-bold mb-8 text-white">My Studio Gallery</h1>
				<div className="w-full flex justify-center items-center mt-20">
					<Player userVideos={serializedVideos} />
				</div>
			</div>
		</div>
	)
}

export default page
