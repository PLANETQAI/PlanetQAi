import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { logInSchema } from './lib/zod'
import bcrypt from 'bcryptjs'
import prisma from './lib/prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
	providers: [
		Credentials({
			credentials: {
				email: { label: 'Email', type: 'email', placeholder: 'example@gmail.com' },
				password: { label: 'Password', type: 'password' },
			},

			async authorize(credentials) {
				try {
					// Validate input using Zod schema
					const validatedCredentials = logInSchema.parse({
						email: credentials.email,
						password: credentials.password,
					})

					// Check if the user exists in the database
					const user = await prisma.user.findUnique({
						where: { email: validatedCredentials.email },
					})
					console.log(user)

					if (!user) {
						throw new Error('User does not exist with this email.')
					}

					// Verify password using bcrypt.compareSync
					const isValidPassword = bcrypt.compareSync(validatedCredentials.password, user.password)
					if (!isValidPassword) {
						throw new Error('Incorrect password.')
					}

					// Return user data to be used in the session and JWT
					return {
						id: user.id,
						fullName: user.fullName,
						email: user.email,
						allowedDownloads: user.allowedDownloads,
						totalDownloads: user.totalDownloads,
						role: user.role,
					}
				} catch (error) {
					throw new Error(error.message || 'Invalid login attempt.')
				}
			},
		}),
	],
	callbacks: {
		async jwt({ token, user, trigger, session }) {
			if (trigger === 'update' || session?.max_download) {
				token.max_download = session.max_download
			}

			if (user) {
				token.id = user.id
				token.max_download = user.max_download
				token.role = user.role
			}
			return token
		},
		async session({ session, token }) {
			if (token) {
				session.user.id = token.id
				session.user.max_download = token.max_download
				session.user.role = token.role
			}
			return session
		},
	},
})
