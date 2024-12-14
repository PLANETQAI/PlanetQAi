import prisma from '@/lib/prisma' // Assuming prisma is set up in this file
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export async function POST(req, res) {
	const session = await auth()

	// Check if the user is authenticated
	if (!session) {
		redirect('/login')
	}

	const data = await req.json()
	let { videoLink, title, thumbnail } = data

	// Validate the video link
	if (!videoLink) {
		return NextResponse.json({ message: 'Link not entered' }, { status: 422 })
	}

	// Basic URL format validation
	const urlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com|spotify\.com)\/.+$/
	const imagePattern = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/

	if (!urlPattern.test(videoLink)) {
		return NextResponse.json({ message: 'Invalid video link format!' }, { status: 422 })
	}

	// Transform Spotify link
	if (videoLink.includes('spotify')) {
		const spotifyPart = videoLink.split('.com')[1]
		videoLink = `https://open.spotify.com/embed${spotifyPart}`
	}

	try {
		// Check if the link already exists in the database
		const existingLink = await prisma.videoLinks.findUnique({
			where: { videoLink: videoLink },
		})

		if (existingLink) {
			return NextResponse.json(
				{ message: 'Song with this link is already in database' },
				{ status: 422 }
			)
		}

		// Insert new video link into the database
		await prisma.videoLinks.create({
			data: {
				userId: session.user.id,
				videoLink: videoLink,
				title,
				thumbnailLink:
					thumbnail || 'https://cdn1.suno.ai/image_d552114f-0ba9-4015-be3b-6b0effd3db9b.png', // Default thumbnail if not provided
			},
		})

		return NextResponse.json({ message: 'Link Stored Successfully!' }, { status: 201 })
	} catch (error) {
		console.log('Error:', error)
		return NextResponse.json(
			{ message: 'Internal Server Error: Unable to store the link' },
			{ status: 500 }
		)
	}
}
