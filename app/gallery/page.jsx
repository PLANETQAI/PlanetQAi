import React from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { connectToDatabase } from '@/lib/db'
import Gallery from './galleries'

export const metadata = {
	title: 'PlanetQProductions',
	description: 'planet q productions music player',
}

const GalleryPage = async () => {
	const session = await auth()

	if (!session) {
		redirect('/login')
	}

	// Establish database connection
	const client = await connectToDatabase()
	const db = client.db()
	const galleryCollection = db.collection('gallery')

	// Find all galleries for the authenticated user
	const userId = session.user.id
	const prevSongsDB = await galleryCollection.find({ user: userId }).toArray()
	const prevSongs = prevSongsDB.map(song => ({
		audioLink: song.audioLink,
		isPaid: song.isPaid,
		userId: song.user,
		id: JSON.parse(JSON.stringify(song._id)),
	}))

	return <Gallery session={session} prevSongs={prevSongs} />
}

export default GalleryPage
