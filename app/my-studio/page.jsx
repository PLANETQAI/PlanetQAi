import React from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Player from './player'
import prisma from '@/lib/prisma'

export const metadata = {
	title: 'PlanetQRadio',
	description: 'Welcome to PlanetQRadio Studio. Upload your music video here.',
}

const page = async () => {
	const session = await auth()

	if (!session) {
		redirect(`/login?redirectTo=/my-studio`)
	} else if (session.user.email !== 'planetqproductions@gmail.com') {
		redirect(`/`)
	}

	const userVideos = await prisma.videoLinks.findMany({
		where: { userId: session.user.id },
		include: {
			user: {
				select: {
					id: true,
					role: true,
					fullName: true,
					password: false,
					email: true,
				},
			},
		},
	})
	console.log(userVideos)

	const backgroundImageStyle = {
		backgroundImage: 'url("/images/back.png")',
		backgroundSize: 'cover',
		backgroundRepeat: 'no-repeat',
		backgroundPosition: 'center',
		minHeight: '100vh',
	}

	return (
		<div style={backgroundImageStyle}>
			<div className="container mx-auto px-4 py-8">
				<h1 className="text-3xl font-bold mb-8 text-white">My Studio Gallery</h1>
				<div className="w-full flex justify-center items-center mt-20">
					<Player userVideos={userVideos} />
				</div>
			</div>
		</div>
	)
}

export default page
