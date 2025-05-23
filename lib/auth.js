// lib/auth.js
import { auth as nextAuth } from '@/auth'

export const authOptions = {
  // Export the auth options for use in API routes
  callbacks: {
    // Re-export the callbacks from the main auth.js file
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.fullName = token.fullName
        session.user.role = token.role
      }
      return session
    },
  },
}

export { nextAuth as auth }
