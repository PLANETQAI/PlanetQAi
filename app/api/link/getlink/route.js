import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req, res) {
	try {
		// Get session to check if user is authenticated
		const session = await auth()
		console.log(session)
		console.log('running here')

		let videoLinks
		const isAdmin = session?.user?.role === 'Admin'
		if (session && isAdmin) {
			if (isAdmin) {
				// Fetch all video links if admin
				videoLinks = await prisma.videoLinks.findMany({
					include: {
						User: {
							select: {
								id: true,
								role: true,
								// Exclude password from response
								password: false,
							},
						},
					},
				})
			}
		} else {
			// Fetch only active video links if no admin
			videoLinks = await prisma.videoLinks.findMany({
				where: {
					isLive: true,
				},
				include: {
					User: {
						select: {
							id: true,
							role: true,
							password: false,
						},
					},
				},
			})
		}

		return NextResponse.json(videoLinks)
	} catch (error) {
		console.log('Error:', error)
		return NextResponse.json(
			{ message: 'Internal Server Error: Unable to get video links' },
			{ status: 500 }
		)
	}
}
