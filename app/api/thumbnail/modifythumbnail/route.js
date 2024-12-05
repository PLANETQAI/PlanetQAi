import { connectToDatabase } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function DELETE(req, res) {
	try {
		const client = await connectToDatabase()

		const linkCollection = client.db().collection('Thumbnail')
		const count = await linkCollection.countDocuments()

		if (count === 0) {
			return NextResponse.json({ message: 'No thumbnail is available to delete' })
		}

		const result = await linkCollection.deleteMany({})

		return NextResponse.json({
			message: `Successfully deleted ${result.deletedCount} Thumbnail`,
			deletedCount: result.deletedCount,
		})
	} catch (error) {
		return NextResponse.json({ message: 'Internal Server Error: Unable to delete thumbnail picture' }, { status: 500 })
	}
}

export async function POST(req, res) {
	const data = req.body

	const { ThumbnailImage } = data

	if (!ThumbnailImage) {
		return NextResponse.json({ message: 'Please Upload a thumbnail image.' })
	}

	const client = await connectToDatabase()
	if (client) {
		const db = client.db()

		const linkCollection = db.collection('Thumbnail')
		const count = await linkCollection.countDocuments()

		if (count === 1) {
			return NextResponse.json({ message: 'Please delete previous thumbnail first to upload a new one.' })
		}

		const existingThumbnail = await linkCollection.findOne({
			ThumbnailImage,
		})

		if (existingThumbnail) {
			return NextResponse.json({ message: 'This thumbnail already exists.' }, { status: 422 })
		}

		const result = await linkCollection.insertOne({ ThumbnailImage })
		return NextResponse.json({ message: 'Thumnail Updated!' })
	} else {
		return NextResponse.json({ message: 'Failed to connect to the database' }, { status: 500 })
	}
}

export async function GET(req, res) {
	try {
		const client = await connectToDatabase()
		const db = client.db()
		const thumbnailCollection = db.collection('Thumbnail')
		const count = await thumbnailCollection.countDocuments()

		if (count === 0) {
			return NextResponse.json({ message: 'no thumbnail is available' })
		}

		const newThumbnail = await thumbnailCollection.find({}, { projection: { _id: 0 } }).toArray()

		return NextResponse.json({ newThumbnail })
	} catch (error) {
		console.log('Error:', error)
		return NextResponse.json({ message: 'Internal Server Error: Unable to get music' }, { status: 500 })
	}
}
