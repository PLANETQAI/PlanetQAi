import { auth } from "@/auth";
import { headers } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from "@/lib/prisma";

/**
 * A reusable server-side function to get the authenticated user object
 * from either a NextAuth.js session cookie or a bearer token.
 * This function centralizes the authentication logic for API routes.
 *
 * @returns {Promise<object|null>} The user object from Prisma if authenticated, otherwise null.
 * @throws {Error} Throws an error if a token is present but is invalid or expired.
 */
export async function getAuthenticatedUser() {
    let userEmail = null;

    // 1. Try to get user from cookie-based session
    try {
        const session = await auth();
        if (session?.user?.email) {
            userEmail = session.user.email;
        }
    } catch (error) {
        // This can fail if the session is invalid. We'll ignore it and
        // let the token check proceed as a fallback.
        console.log("Cookie session check failed, proceeding to token check.");
    }

    // 2. If no cookie session, try to get user from bearer token
    if (!userEmail) {
        const token = headers().get('authorization')?.split(' ')[1];

        if (token) {
            // jwtVerify will throw an error if the token is invalid or expired
            const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
            const { payload } = await jwtVerify(token, secret, {
                issuer: 'urn:planetqai:api',
                audience: 'urn:planetqai:api:client',
            });

            if (payload?.email) {
                userEmail = payload.email;
            }
        }
    }

    // 3. If we have an email from either method, fetch the full user object
    if (userEmail) {
        const user = await prisma.user.findUnique({
            where: { email: userEmail },
        });
        return user;
    }

    // 4. If no user was authenticated, return null
    return null;
}
