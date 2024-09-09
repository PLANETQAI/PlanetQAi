import { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import Stripe from "stripe";
import { connectToDatabase } from "../../../lib/db";
import { getToken } from "next-auth/react";
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

        break;
      case "customer.subscription.deleted":
        subscription = event.data.object;
        status = subscription.status;

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

        break;
      case "checkout.session.completed":
        try {
          const subscription = event.data.object;

          const userId = subscription?.metadata?.userId;
          const max_download = subscription?.metadata?.max_download;

          if (!userId || isNaN(max_download)) {
            throw new Error("Invalid user ID or max_download value");
          }

          const client = await connectToDatabase();
          const usersCollection = client.db().collection("login");

          // Find the user in the database
          const user = await usersCollection.findOne({
            _id: new ObjectId(userId),
          });

          if (user) {
            const updatedMaxDownload =
              (Number(user.max_download) || 0) + Number(max_download);

            // Update user's max_download in the database
            await usersCollection.updateOne(
              { _id: new ObjectId(userId) },
              {
                $set: { max_download: updatedMaxDownload },
              }
            );

            // Fetch updated user data to reflect the new max_download value
            const updatedUser = await usersCollection.findOne({
              _id: new ObjectId(userId),
            });

            console.log(updatedUser)

            // Assuming you're using NextAuth, get the token for the user
            const token = await getToken({
              req: null, // or pass req if available
              secret: process.env.NEXTAUTH_SECRET,
            });

            if (token) {
              token.max_download = updatedUser.max_download;
            }
          } else {
            throw new Error("User not found");
          }
        } catch (error) {
          console.error(
            "Error processing checkout.session.completed:",
            error.message
          );
          // Handle error appropriately, log or notify as needed
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
