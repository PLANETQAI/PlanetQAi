
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import PlanetQProductions from './planetQ'
import prisma from '@/lib/prisma'

export const metadata = {
	title: 'PlanetQRadio',
	description: 'planet q productions music player',
}

const Page = async () => {
	const session = await auth()
	let videoLinks

	if (!session) {
		redirect('/login?redirectTo=/planetqproductions')
	} else {
		const isAdmin = session.user.role === 'Admin'

		if (isAdmin) {
			// Fetch all video links if admin
			videoLinks = await prisma.videoLinks.findMany({
				include: {
					User: {
						select: {
							id: true,
							role: true,
							fullName: true,
							// Exclude password from response
							password: false,
						},
					},
				},
			})
		} else {
			// Fetch only active video links if no session or admin
			videoLinks = await prisma.videoLinks.findMany({
				where: {
					isLive: true,
				},
				include: {
					User: {
						select: {
							id: true,
							role: true,
							fullName: true,
							password: false,
						},
					},
				},
			})
		}

		return <PlanetQProductions session={session} songData={videoLinks} />
	}
}

export default Page
