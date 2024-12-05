import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export async function POST(req, res) {
	const session = await auth()
	if (!session) {
		redirect('/login')
	}

	const data = await req.json()
	let { videoLink, title, thumbnail } = data

	if (!videoLink) {
		return NextResponse.json({ message: 'Link not entered' }, { status: 422 })
	}

	// if (!thumbnail) {
	//   res.status(422).json({ message: "Thumbnail link not entered" });
	//   return;
	// }

	// Basic URL format validation
	const urlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com|spotify\.com)\/.+$/
	const imagePattern = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/

	if (!urlPattern.test(videoLink)) {
		return NextResponse.json({ message: 'Invalid video link format!' }, { status: 422 })
	}

	// if (!imagePattern.test(thumbnail)) {
	//   res.status(422).json({ message: "Invalid thumbnail link format!" });
	//   return;
	// }

	// Transform Spotify link
	if (videoLink.includes('spotify')) {
		const spotifyPart = videoLink.split('.com')[1]
		videoLink = `https://open.spotify.com/embed${spotifyPart}`
	}

	const client = await connectToDatabase()
	if (!client) {
		return NextResponse.json({ message: 'Failed to connect to the database' }, { status: 500 })
	}

	const db = client.db()
	const existingLink = await db.collection('videolinks').findOne({ link: videoLink })

	if (existingLink) {
		return NextResponse.json({ message: 'Song with this link is already in database' }, { status: 422 })
	}

	const result = await db.collection('videolinks').insertOne({
		user: session.user.id,
		status: 'pending',
		link: videoLink,
		title,
		thumbnail: 'https://cdn1.suno.ai/image_d552114f-0ba9-4015-be3b-6b0effd3db9b.png',
	})
	return NextResponse.json({ message: 'Link Stored Successfully!' }, { status: 201 })
}
