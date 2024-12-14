import prisma from '@/lib/prisma' // Assuming Prisma client is set up
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(req) {
	// Get session to find the logged-in user
	const session = await auth()
	if (!session) {
		return NextResponse.json({ message: 'Unauthorized' })
	}

	const { max_download, userId } = req.body

	// Validate input
	if (max_download < 0) {
		return NextResponse.json({ message: 'Invalid max_download value' }, { status: 400 })
	}

	try {
		// Update max_download using Prisma
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { max_download: Number(max_download) },
		})

		return NextResponse.json(
			{ message: 'User max_download updated successfully', user: updatedUser },
			{ status: 200 }
		)
	} catch (error) {
		console.error('Error updating user max_download:', error)
		return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
	}
}
