import prisma from '@/lib/prisma' // Assuming prisma is set up in this file
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(req) {
	let session

	// Authenticate the user
	try {
		session = await auth()
		console.log('sesson from api', session)
	} catch (error) {
		console.log('Authentication Error:', error)
		return NextResponse.json({ message: 'Authentication failed' }, { status: 500 })
	}

	if (!session) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
	}

	const data = await req.json()
	// Validate payload
	if (!data || typeof data !== 'object') {
		return NextResponse.json({ message: 'Invalid payload' }, { status: 400 })
	}

	const { videoLink, title, thumbnail } = data

	// Validate video link
	if (!videoLink) {
		return NextResponse.json({ message: 'Link not entered' }, { status: 422 })
	}

	try {
		new URL(videoLink)
	} catch {
		return NextResponse.json({ message: 'Invalid video link format!' }, { status: 422 })
	}

	// Transform Spotify links
	let finalVideoLink = videoLink
	if (videoLink.includes('spotify')) {
		const spotifyPart = videoLink.split('.com')[1]
		finalVideoLink = `https://open.spotify.com/embed${spotifyPart}`
	}

	try {
		// Check if the link already exists
		const existingLink = await prisma.videoLinks.findFirst({
			where: { videoLink: finalVideoLink },
		})

		if (existingLink) {
			return NextResponse.json(
				{ message: 'Song with this link is already in database' },
				{ status: 422 }
			)
		}

		await prisma.videoLinks.create({
			data: {
				userId: session.user.id,
				videoLink: finalVideoLink,
				title,
				thumbnailLink:
					thumbnail || 'https://cdn1.suno.ai/image_d552114f-0ba9-4015-be3b-6b0effd3db9b.png',
			},
		})
		console.log('running step 2')
		return NextResponse.json({ message: 'Link Stored Successfully!' }, { status: 201 })
	} catch (error) {
		console.log('Error:', error)
		return NextResponse.json(
			{ message: 'Internal Server Error: Unable to store the link' },
			{ status: 500 }
		)
	}
}
