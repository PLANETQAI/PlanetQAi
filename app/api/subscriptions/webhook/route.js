import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'
import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()


const stripe = new Stripe(process.env.STRIPE_SUBSCRIPTION_SECRET_KEY || process.env.NEXT_PUBLIC_STRIPE_SUBSCRIPTION_SECRET_KEY)

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req) {
	const sig = req.headers.get('stripe-signature')
	// In App Router, we need to get the raw body differently
	const buf = await req.text()

	const endpointSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET

	let event

	try {
		event = await stripe.webhooks.constructEventAsync(buf.toString(), sig, endpointSecret)
	} catch (err) {
		console.log('Webhook signature verification failed.', err.message)
		return NextResponse.json({ message: `Webhook Error: ${err.message}` }, { status: 400 })
	}

	let subscription
	let status

	switch (event.type) {
		case 'customer.subscription.trial_will_end':
			subscription = event.data.object
			status = subscription.status
			break
		case 'customer.subscription.deleted':
			subscription = event.data.object
			status = subscription.status
			break
		case 'customer.subscription.created':
			subscription = event.data.object
			status = subscription.status
			console.log('Subscription created successfully.')
			break
		case 'customer.subscription.updated':
			subscription = event.data.object
			status = subscription.status
			console.log(`Subscription status is ${status}. Subscription updated.`)
			break
		case 'billing_portal.session.created':
			subscription = event.data.object
			status = subscription.status
			break
		case 'checkout.session.completed':
			try {
				const subscription = event.data.object
				const userId = subscription?.metadata?.userId
				const max_download = subscription?.metadata?.max_download

				if (!userId || isNaN(max_download)) {
					throw new Error('Invalid user ID or max_download value')
				}

				// Use Prisma to find the user
				const user = await prisma.user.findUnique({
					where: { id: userId },
				})

				if (user) {
					const updatedMaxDownload = (Number(user.max_download) || 0) + Number(max_download)

					// Update user's max_download in the database using Prisma
					await prisma.user.update({
						where: { id: userId },
						data: { max_download: updatedMaxDownload },
					})

					// Fetch updated user data
					const updatedUser = await prisma.user.findUnique({
						where: { id: userId },
					})

					console.log(updatedUser)

					// Assuming you're using NextAuth, get the token for the user
					const token = await getToken({
						req: null, // or pass req if available
						secret: process.env.AUTH_SECRET,
					})

					if (token) {
						token.max_download = updatedUser.max_download
					}
				} else {
					throw new Error('User not found')
				}
			} catch (error) {
				console.log('Error processing checkout.session.completed:', error.message)
				// Handle error appropriately, log or notify as needed
			}
			break
		default:
			console.log(`Unhandled event type ${event.type}.`)
	}

	return NextResponse.json({ received: true })
}
