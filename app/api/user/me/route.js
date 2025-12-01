import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    const session = await auth();

    if (!session?.user?.email) {
        return new Response(JSON.stringify({ error: "Not authenticated" }), {
            status: 401,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                fullName: true,
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
                        expiresAt: 'asc' // Sort by expiration date (earliest first)
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

        if (!user) {
            return new Response(JSON.stringify({ error: "User not found" }), {
                status: 404,
                headers: {
                    "Content-Type": "application/json",
                },
            });
        }

        return new Response(JSON.stringify({
            user: {
                ...user,
            }
        }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (error) {
        console.error("Error fetching user data:", error);
        return new Response(JSON.stringify({
            error: "Failed to fetch user data",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
}