import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { logInSchema } from './lib/zod'
import bcrypt from 'bcryptjs'
import prisma from './lib/prisma'

export const runtime = 'nodejs';

// Configure NextAuth with proper security settings
const authConfig = {
	// Configure pages for authentication
	pages: {
		signIn: '/login',
		error: '/login',
	},
	
	// Set a secure secret for NextAuth
	secret: process.env.NEXTAUTH_SECRET || 'planetqai-temporary-secret-key-change-me-in-production',
	
	// Trust the host in all environments to avoid CSRF issues
	trustHost: true,
	
	providers: [
		Credentials({
			// Disable CSRF protection for credentials provider
			csrf: false,
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
						select: {
							id: true,
							email: true,
							password: true,
							fullName: true,
							role: true,
							isVerified: true,
							isSuspended: true,
							credits: true,
							max_download: true,
							totalDownloads: true,
							createdAt: true,
							lastLoginAt: true
							// Explicitly select only the fields we need
							// This prevents errors if some fields are missing in the database
						}
					})
					console.log(user)

					if (!user) {
						throw new Error('User does not exist with this email.')
					}

					// Check if the user is suspended
					if (user.isSuspended && user.role !== 'Admin') {
						throw new Error('Your account has been suspended. Please contact support for assistance.')
					}

					// Check if the user is verified
					if (!user.isVerified && user.role !== 'Admin') {
						throw new Error('Please verify your email before logging in. Check your inbox for a verification link.')
					}

					// Verify password using bcrypt.compareSync
					const isValidPassword = bcrypt.compareSync(validatedCredentials.password, user.password)
					if (!isValidPassword) {
						throw new Error('Incorrect password.')
					}

					// Update last login time
					await prisma.user.update({
						where: { id: user.id },
						data: { lastLoginAt: new Date() }
					}).catch(err => {
						// Don't fail login if this update fails
						console.error('Failed to update last login time:', err);
					});

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
				token.id = user.id
				token.fullName = user.fullName
				token.email = user.email
				token.role = user.role
				token.isVerified = user.isVerified
				token.credits = user.credits
				token.max_download = user.max_download
				token.totalDownloads = user.totalDownloads
				token.createdAt = user.createdAt
			}
			return token
		},
		async session({ session, token }) {
			if (token) {
				session.user.id = token.id
				session.user.fullName = token.fullName
				session.user.email = token.email
				session.user.role = token.role
				session.user.isVerified = token.isVerified
				session.user.credits = token.credits
				session.user.max_download = token.max_download
				session.user.totalDownloads = token.totalDownloads
				session.user.createdAt = token.createdAt
			}
			return session
		},
	},
}

// Export NextAuth handlers and functions
export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)
