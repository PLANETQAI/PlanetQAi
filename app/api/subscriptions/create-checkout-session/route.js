import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET)

// const stripe = new Stripe("sk_test_51DuUNrLEbBbuiNy4C37Zjysx6YqgKd7q3dPj8mame7nc3V60KRlhLRwNYdgzG3SJlTCVGHdeS7fLlk7y4ey9J6b400J9jPM0Ie");

export async function POST(req, res) {
	const userId = req.body.user.id
	const lookupKey = req.body.lookup_key
	const max_download = req.body.max_download

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
