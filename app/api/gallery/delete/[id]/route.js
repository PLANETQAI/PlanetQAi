import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Route segment config
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function DELETE(req, { params }) {
	try {
		const { id } = await params

		if (!id) {
			return NextResponse.json({ message: 'ID is required' }, { status: 400 })
		}

		// Get session to check if user is authenticated
		const session = await auth()

		if (!session) {
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
		}

		// Get the user's ID from the session
		const userId = session.user.id

		// Find the gallery item first to get its audioLink
		const galleryItem = await prisma.gallery.findUnique({
			where: {
				id: id
			}
		})

		if (!galleryItem) {
			return NextResponse.json({ message: 'Gallery item not found' }, { status: 404 })
		}

		// Verify the gallery item belongs to the user
		if (galleryItem.userId !== userId) {
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
		}

		// Delete the gallery item by ID
		const result = await prisma.gallery.delete({
			where: {
				id: id
			}
		})

		// No need to check result.count since delete will throw if not found

		// Return a success response
		return NextResponse.json({ message: 'Song deleted successfully' }, { status: 200 })
	} catch (error) {
		console.log('Error:', error)
		return NextResponse.json(
			{ message: 'Internal Server Error: Unable to delete song' },
			{ status: 500 }
		)
	}
}
