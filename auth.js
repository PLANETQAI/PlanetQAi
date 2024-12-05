import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { connectToDatabase } from './lib/db'
import { logInSchema } from './lib/zod'
import bcrypt from 'bcryptjs'

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

					// Connect to the database
					const client = await connectToDatabase()
					const usersCollection = client.db().collection('login')

					// Check if the user exists
					const user = await usersCollection.findOne({ email: validatedCredentials.email })
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
						id: user._id,
						email: user.email,
						max_download: user.max_download,
						userType: user.userType,
						sessionId: user.sessionId,
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
				// token.userType = session.userType;
				// token.sessionId = session.sessionId;
			}

			if (user) {
				token.id = user.id
				token.max_download = user.max_download
				token.role = user.role
				// token.userType = user.userType;
				// token.sessionId = user.sessionId;
			}
			return token
		},
		async session({ session, token }) {
			if (token) {
				session.user.id = token.id
				session.user.max_download = token.max_download
				session.user.role = token.role
				// session.user.userType = token.userType;
				// session.user.sessionId = token.sessionId;
			}
			return session
		},
	},
})
