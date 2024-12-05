import { connectToDatabase } from '@/lib/db'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'

export async function GET(req, { params }, res) {
	const allParams = await params
	console.log(allParams.id)
	const { id } = allParams

	if (!ObjectId.isValid(id)) {
		return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 })
	}

	let client

	try {
		client = await connectToDatabase()
		const usersCollection = client.db().collection('login')

		const user = await usersCollection.findOne({
			_id: new ObjectId(id),
		})

		if (!user) {
			return NextResponse.json({ message: 'User not found' }, { status: 404 })
		}

		delete user.password
		return NextResponse.json({ user })
	} catch (error) {
		console.log('Failed to fetch user:', error)
		return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
	} finally {
		if (client) {
			await client.close()
		}
	}
}
