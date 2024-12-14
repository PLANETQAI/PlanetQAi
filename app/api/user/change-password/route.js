import prisma from '@/lib/prisma' // Assuming Prisma client is set up
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { saltAndHashPassword } from '@/utils/password'

export async function PATCH(req, res) {
	try {
		const session = await auth()
		if (!session) {
			redirect('/login')
		}

		const { oldPassword, newPassword } = await req.json()

		// Validate input
		if (!newPassword || newPassword.trim().length < 7) {
			return NextResponse.json(
				{ message: 'Invalid input - new password should be at least 7 characters.' },
				{ status: 422 }
			)
		}

		// Find the user by session email using Prisma
		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
		})

		if (!user) {
			return NextResponse.json({ message: 'User not found.' }, { status: 404 })
		}

		// Verify old password
		const isOldPasswordValid = bcrypt.compareSync(oldPassword, user.password)
		if (!isOldPasswordValid) {
			return NextResponse.json({ message: 'Your old password is incorrect!' }, { status: 401 })
		}

		// Hash the new password
		const hashedNewPassword = saltAndHashPassword(newPassword)

		// Update the password using Prisma
		await prisma.user.update({
			where: { email: session.user.email },
			data: { password: hashedNewPassword },
		})

		return NextResponse.json({ message: 'Password updated successfully!' }, { status: 200 })
	} catch (error) {
		return NextResponse.json({ message: error.message || 'Something went wrong!' }, { status: 500 })
	}
}
