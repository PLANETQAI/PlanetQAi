import { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import Stripe from "stripe";
import { connectToDatabase } from "../../../lib/db";
import {  getToken } from "next-auth/react";
import { ObjectId } from "mongodb";
const stripe = new Stripe(process.env.STRIPE_SECRET);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    const sig = req.headers["stripe-signature"];
    const buf = await buffer(req);
    const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        buf.toString(),
        sig,
        endpointSecret
      );
    } catch (err) {
      console.error("Webhook signature verification failed.", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    let subscription;
    let status;

    switch (event.type) {
      case "customer.subscription.trial_will_end":
        subscription = event.data.object;
        status = subscription.status;
        console.log(
          `Subscription status is ${status}. Subscription trial will end.`
        );
        break;
      case "customer.subscription.deleted":
        subscription = event.data.object;
        status = subscription.status;

        const deletedUserId = subscription?.metadata?.userId;

        if (deletedUserId) {
          try {
            const client = await connectToDatabase();
            const usersCollection = client.db().collection("login");

            await usersCollection.updateOne(
              { _id: new ObjectId(deletedUserId) },
              {
                $set: {
                  userType: "member",
                  sessionId: null,
                },
              }
            );

            console.log(`User ${deletedUserId} downgraded to free user type.`);
          } catch (error) {
            console.error(
              "Failed to update user type on subscription deletion:",
              error
            );
          }
        }
        break;
      case "customer.subscription.created":
        subscription = event.data.object;
        status = subscription.status;
        console.log("Subscription created successfully.");
        break;
      case "customer.subscription.updated":
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}. Subscription updated.`);
        break;
      case "billing_portal.session.created":
        subscription = event.data.object;
        status = subscription.status;

        console.log(subscription?.metadata);

        break;
      case "checkout.session.completed":
        subscription = event.data.object;
        status = subscription.status;

        const userId = subscription?.metadata?.userId;

        const client = await connectToDatabase();
        const usersCollection = client.db().collection("login");

        const user = await usersCollection.find({
          _id: new ObjectId(userId),
        });

        if (user) {
          await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            {
              $set: {
                userType: "premium",
                sessionId: subscription.id,
              },
            }
          );
        }

        // Update NextAuth session token
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

        if (token) {
          token.userType = "premium";
          token.sessionId = subscription.id;
        }

        break;
      default:
        console.log(`Unhandled event type ${event.type}.`);
    }

    res.status(200).json({ received: true });
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
