import React from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Gallery from './galleries'
import prisma from '@/lib/prisma'

export const metadata = {
	title: 'PlanetQProductions',
	description: 'planet q productions music player',
}

const GalleryPage = async () => {
	const session = await auth()

	if (!session) {
		redirect('/login')
	}

	// Get the user's ID from the session
	const userId = session.user.id

	// Find all galleries for the authenticated user
	const prevSongsDB = await prisma.gallery.findMany({
		where: { userId: userId },
	})

	const prevSongs = prevSongsDB.map(song => ({
		audioLink: song.audioLink,
		isPaid: song.isPaid,
		userId: song.user,
		id: song.id, // Prisma IDs are already strings
	}))

	return <Gallery session={session} prevSongs={prevSongs} />
}

export default GalleryPage
