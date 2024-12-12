import React from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Player from './player'

export const metadata = {
	title: 'PlanetQRadio',
	description: 'Welcome to PlanetQRadio Studio. Upload your music video here.',
}

const page = async () => {
	const session = await auth()
	console.log(process.env.NODE_ENV)
	console.log(process.env.NEXTAUTH_URL)
	
	const domain =
		process.env.NODE_ENV !== 'development' ? process.env.NEXTAUTH_URL : process.env.DOMAIN

	if (!session) {
		redirect(`${domain}/login?redirectTo=/my-studio`)
	} else if (session.user.email !== 'planetqproductions@gmail.com') {
		redirect(`/`)
	}

	let serializedVideos = []
	try {
		const res = await fetch(`${domain}/api/my-studio`)
		serializedVideos = await res.json()
		console.log(serializedVideos)
	} catch (error) {
		console.log(error)
	}

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
					<Player userVideos={serializedVideos} />
				</div>
			</div>
		</div>
	)
}

export default page
