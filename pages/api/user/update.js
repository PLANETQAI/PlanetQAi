import { getSession } from "next-auth/react";
import { connectToDatabase } from "../../../lib/db";// Adjust the path according to your project structure
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // Get session to find the logged-in user
  // const session = await getSession({ req });
  // if (!session) {
  //   return res.status(401).json({ message: "Unauthorized" });
  // }

  const { max_download, userId } = req.body;
  if (!max_download || isNaN(max_download)) {
    return res.status(400).json({ message: "Invalid max_download value" });
  }

  try {
    const client = await connectToDatabase();
    const usersCollection = client.db().collection("login");

    // Update max_download in the database
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { max_download: Number(max_download) } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Optionally, you could return the updated user data
    const updatedUser = await usersCollection.findOne({
      _id: new ObjectId(userId),
    });

    // Update the session using the NextAuth update() function on the client-side later
    return res.status(200).json({
      message: "User max_download updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user max_download:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
