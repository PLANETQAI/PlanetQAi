export const runtime = 'nodejs'

import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

// Make sure to use the correct environment variable name
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY)

export async function POST(req) {
	const data = await req.json()
	const userId = data.user.id
	const lookupKey = data.lookup_key
	const max_download = data.max_download

	try {
		const prices = await stripe.prices.list({
			lookup_keys: [lookupKey],
			expand: ['data.product'],
		})

		if (prices.data.length === 0) {
			throw new Error('Price not found for the provided lookup key')
		}

		const price = prices.data[0]

		const session = await stripe.checkout.sessions.create({
			billing_address_collection: 'auto',
			// payment_method_types: ['card'],
			line_items: [
				{
					price_data: {
						currency: price.currency,
						product_data: {
							name: price.product.name,
						},
						unit_amount: price.unit_amount, // Use the actual unit_amount from the price object
					},
					quantity: 1,
				},
			],
			mode: 'payment',
			success_url: `https://www.planetqradio.com/gallery/?success=true`,
			cancel_url: `https://www.planetqradio.com/gallery/?canceled=true`,
			metadata: {
				userId,
				max_download,
			},
		})
		return redirect(session.url)
	} catch (error) {
		// res.status(500).json({ error: error.message })
		return NextResponse.json({ error: error.message }, { status: 500 })
	}
}
