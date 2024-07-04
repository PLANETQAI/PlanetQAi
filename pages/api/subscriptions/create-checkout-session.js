import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const userId = req.body.user_id;
    const lookupKey = req.body.lookup_key;

    try {
      const prices = await stripe.prices.list({
        lookup_keys: [lookupKey],
        expand: ['data.product'],
      });

      const session = await stripe.checkout.sessions.create({
        billing_address_collection: 'auto',
        payment_method_types: ['card'],
        line_items: [
          {
            price: prices.data[0]?.id,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.DOMAIN}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.DOMAIN}?canceled=true`,
        metadata: {
          userId,
        },
      });

      res.redirect(303, session.url);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
