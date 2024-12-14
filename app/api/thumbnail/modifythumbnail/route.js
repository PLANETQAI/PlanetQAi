import prisma from '@/lib/prisma' // Assuming Prisma client is set up
import { NextResponse } from 'next/server'

export async function DELETE(req, res) {
	try {
		// Check if a thumbnail exists
		const count = await prisma.thumbnail.count()

		if (count === 0) {
			return NextResponse.json({ message: 'No thumbnail is available to delete' })
		}

		// Delete all thumbnails
		const result = await prisma.thumbnail.deleteMany()

		return NextResponse.json({
			message: `Successfully deleted ${result.count} Thumbnail`,
			deletedCount: result.count,
		})
	} catch (error) {
		return NextResponse.json(
			{ message: 'Internal Server Error: Unable to delete thumbnail picture' },
			{ status: 500 }
		)
	}
}

export async function POST(req, res) {
	const data = await req.json()

	const { ThumbnailImage } = data

	if (!ThumbnailImage) {
		return NextResponse.json({ message: 'Please Upload a thumbnail image.' })
	}

	try {
		// Check if a thumbnail exists
		const count = await prisma.thumbnail.count()

		if (count === 1) {
			return NextResponse.json({
				message: 'Please delete previous thumbnail first to upload a new one.',
			})
		}

		// Check if the thumbnail already exists
		const existingThumbnail = await prisma.thumbnail.findUnique({
			where: { ThumbnailImage },
		})

		if (existingThumbnail) {
			return NextResponse.json({ message: 'This thumbnail already exists.' }, { status: 422 })
		}

		// Insert new thumbnail
		await prisma.thumbnail.create({
			data: { ThumbnailImage },
		})

		return NextResponse.json({ message: 'Thumbnail Updated!' })
	} catch (error) {
		return NextResponse.json({ message: 'Failed to connect to the database' }, { status: 500 })
	}
}

export async function GET(req, res) {
	try {
		const count = await prisma.thumbnail.count()

		if (count === 0) {
			return NextResponse.json({ message: 'No thumbnail is available' })
		}

		// Fetch the thumbnail(s) from the database
		const newThumbnail = await prisma.thumbnail.findMany({
			select: { ThumbnailImage: true },
		})

		return NextResponse.json({ newThumbnail })
	} catch (error) {
		return NextResponse.json(
			{ message: 'Internal Server Error: Unable to get music' },
			{ status: 500 }
		)
	}
}
