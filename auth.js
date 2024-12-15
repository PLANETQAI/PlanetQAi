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

					return user
				} catch (error) {
					throw new Error(error.message || 'Invalid login attempt.')
				}
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.fullName = user.fullName
				token.role = user.role
				token.max_download = user.max_download
				token.totalDownloads = user.totalDownloads
			}
			return token
		},
		async session({ session, token }) {
			if (token) {
				session.user.fullName = token.fullName
				session.user.role = token.role
				session.user.max_download = token.max_download
				session.user.totalDownloads = token.totalDownloads
			}
			return session
		},
	},
})
