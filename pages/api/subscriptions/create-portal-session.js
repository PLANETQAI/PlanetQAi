import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET);
// const stripe = new Stripe("sk_test_51DuUNrLEbBbuiNy4C37Zjysx6YqgKd7q3dPj8mame7nc3V60KRlhLRwNYdgzG3SJlTCVGHdeS7fLlk7y4ey9J6b400J9jPM0Ie");

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { session_id } = req.body;

    try {
      const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: checkoutSession.customer,
        return_url: "https://www.planetqradio.com/gallery",
      });

      res.redirect(303, portalSession.url);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
