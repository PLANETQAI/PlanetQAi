import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { jwtVerify } from 'jose';
import { headers } from 'next/headers';

async function getUserByEmail(email) {
    return prisma.user.findUnique({
        where: { email: email },
        select: {
            id: true,
            fullName: true,
            profilePictureUrl:true,
            email: true,
            role: true,
            credits: true,
            radioCredits: true,
            totalCreditsUsed: true,
            maxMonthlyCredits: true,
            totalDownloads: true,
            max_download: true,
            isVerified: true,
            isSuspended: true,
            stripeCustomerId: true,
            stripeAccountId: true,
            lastLoginAt: true,
            isRadioSubscribed: true,
            radioSubscriptionExpiresAt: true,
            totalEarnedCredits: true,
            referralCode: true,
            creditsRemaining: true,
            rewards: {
                where: {
                    status: 'active',
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gte: new Date() } }
                    ]
                },
                select: {
                    id: true,
                    type: true,
                    points: true,
                    description: true,
                    expiresAt: true,
                    metadata: true,
                    createdAt: true
                },
                orderBy: {
                    expiresAt: 'asc'
                },
            },
            _count: {
                select: {
                    Song: true,
                    Gallery: true,
                    Media: true
                }
            }
        }
    });
}

export async function GET() {
    let userEmail = null;

    // 1. Try to get user from cookie-based session
    try {
        const session = await auth();
        if (session?.user?.email) {
            userEmail = session.user.email;
        }
    } catch (error) {
        // This can happen if the session is invalid, but we can ignore it
        // and proceed to check for a bearer token.
        console.log("Cookie session check failed, proceeding to token check.");
    }

    // 2. If no cookie session, try to get user from bearer token
    if (!userEmail) {
        const headersList = headers();
        const authorization = headersList.get('authorization');
        const token = authorization?.split(' ')[1];

        if (token) {
            try {
                const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
                const { payload } = await jwtVerify(token, secret, {
                    issuer: 'urn:planetqai:api',
                    audience: 'urn:planetqai:api:client',
                });
                if (payload?.email) {
                    userEmail = payload.email;
                }
            } catch (error) {
                const errorMessage = error.code === 'ERR_JWT_EXPIRED' 
                    ? "Not authenticated: Token has expired" 
                    : "Not authenticated: Invalid token";
                return new Response(JSON.stringify({ error: errorMessage }), {
                    status: 401,
                    headers: { "Content-Type": "application/json" },
                });
            }
        }
    }

    // 3. If no user email was found from either method, deny access
    if (!userEmail) {
        return new Response(JSON.stringify({ error: "Not authenticated" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    // 4. If we have a user email, fetch the detailed user data
    try {
        const user = await getUserByEmail(userEmail);

        if (!user) {
            return new Response(JSON.stringify({ error: "User not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ user }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error fetching user data:", error);
        return new Response(JSON.stringify({
            error: "Failed to fetch user data",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
