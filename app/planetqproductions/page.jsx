import React from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import PlanetQProductions from './planetQ'

export const metadata = {
	title: 'PlanetQRadio',
	description: 'planet q productions music player',
}

const Page = async () => {
	const session = await auth()

	if (!session) {
		redirect('/')
	} else {
		let songData = []
		console.log(songData, 'from here')
		const response = await fetch(`${process.env.DOMAIN}api/link/getlink`)
		songData = await response.json()
		console.log('crossed this')

		return <PlanetQProductions session={session} songData={songData} />
	}
}

export default Page
