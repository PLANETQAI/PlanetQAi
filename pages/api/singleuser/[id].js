import { connectToDatabase } from "../../../lib/db";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { id } = req.query;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  let client;

  try {
    client = await connectToDatabase();
    const usersCollection = client.db().collection("login");

    const user = await usersCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    delete user.password;
    return res.status(200).json(user);
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
