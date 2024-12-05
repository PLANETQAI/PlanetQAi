import React from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import HeadContent from '@/components/Home/HeaderContent'
import AdminLink from '@/components/Home/adminlink'
import Home from './home'

export const metadata = {
	title: 'PlanetQProductions',
	description: 'planet q productions music player home.',
}

const HomePage = async () => {
	const session = await auth()

	const backgroundImageStyle = {
		backgroundImage: 'url("/images/back.png")',
		backgroundSize: 'cover',
		backgroundRepeat: 'no-repeat',
		backgroundPosition: 'center',
		minHeight: '100vh',
	}

	return (
		<>
			<div style={backgroundImageStyle}>
				<HeadContent session={session} />
				<Home session={session} />
				<AdminLink />
			</div>
		</>
	)
}

export default HomePage
