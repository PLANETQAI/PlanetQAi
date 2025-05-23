import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

// Make sure to use the correct environment variable name
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY);

export async function POST(req) {
	const data = await req.json()
	const { session_id } = data

	try {
		const checkoutSession = await stripe.checkout.sessions.retrieve(session_id)

		const portalSession = await stripe.billingPortal.sessions.create({
			customer: checkoutSession.customer,
			return_url: 'https://www.planetqradio.com/gallery',
		})

		return redirect(portalSession.url)
	} catch (error) {
		return NextResponse.json({ error: error.message })
	}
}
