import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { session_id } = req.body;

    try {
      const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: checkoutSession.customer,
        return_url: process.env.DOMAIN,
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
