import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function DELETE(req) {
	const session = await auth()

	// Check if the user is authenticated
	if (!session) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
	}

	// Check if the user is an admin
	const isAdmin = session.user.role === 'Admin'
	if (!isAdmin) {
		return NextResponse.json(
			{ message: 'Forbidden: You do not have permission to perform this action' },
			{ status: 403 }
		)
	}

	const { songId } = await req.json()

	if (!songId) {
		return NextResponse.json({ message: 'Bad Request: songId is required' }, { status: 400 })
	}

	try {
		// Delete the song using Prisma
		const result = await prisma.videoLinks.delete({
			where: {
				id: songId,
			},
		})

		return NextResponse.json({ message: 'Successfully deleted the song' }, { status: 200 })
	} catch (error) {
		console.error('Error deleting song:', error)

		// Check for specific errors (e.g., record not found)
		if (error.code === 'P2025') {
			return NextResponse.json({ message: 'Song not found' }, { status: 404 })
		}

		return NextResponse.json(
			{ message: 'Internal Server Error: Unable to delete the song' },
			{ status: 500 }
		)
	}
}
