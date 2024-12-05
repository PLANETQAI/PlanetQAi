import { NextApiRequest, NextApiResponse } from 'next'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET)
// const stripe = new Stripe("sk_test_51DuUNrLEbBbuiNy4C37Zjysx6YqgKd7q3dPj8mame7nc3V60KRlhLRwNYdgzG3SJlTCVGHdeS7fLlk7y4ey9J6b400J9jPM0Ie");

export async function POST(req, res) {
	const { session_id } = req.body

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
