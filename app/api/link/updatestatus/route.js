import prisma from '@/lib/prisma' // Assuming prisma is set up in this file
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function PUT(req, res) {
	const session = await auth()

	// Check if the user is authenticated
	if (!session) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
	}

	// Check if the user is an admin
	const isAdmin = session.user.role === 'admin'
	if (!isAdmin) {
		return NextResponse.json(
			{ message: 'Forbidden: You do not have permission to perform this action' },
			{ status: 403 }
		)
	}

	const { songId, newStatus } = await req.json()

	if (!songId || !newStatus) {
		return NextResponse.json(
			{ message: 'Bad Request: songId and newStatus are required' },
			{ status: 400 }
		)
	}

	try {
		// Find the video link by songId
		const videoLinks = await prisma.videoLinks.findUnique({
			where: { id: songId },
		})

		if (!videoLinks) {
			return NextResponse.json({ message: 'Song not found' }, { status: 404 })
		}

		// Update the status of the video link
		const updatedVideoLink = await prisma.videoLinks.update({
			where: { id: songId },
			data: { status: newStatus },
		})

		return NextResponse.json({ message: 'Successfully updated the song status' }, { status: 200 })
	} catch (error) {
		console.log('Error:', error)
		return NextResponse.json(
			{ message: 'Internal Server Error: Unable to update the song status' },
			{ status: 500 }
		)
	}
}
