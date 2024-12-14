import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req, res) {
	try {
		const body = await req.json()
		const { user, audioLink } = body

		if (!user) {
			return NextResponse.json({ message: 'User is required!' }, { status: 422 })
		}

		if (!audioLink) {
			return NextResponse.json({ message: 'Link not entered' }, { status: 422 })
		}

		const result = await prisma.gallery.create({
			data: {
				user,
				audioLink,
				isPaid: false,
			},
		})

		return NextResponse.json({ message: 'Music created Successfully!', result }, { status: 201 })
	} catch (error) {
		console.error(error)
		return NextResponse.json({ message: 'Something went wrong!' }, { status: 500 })
	}
}
