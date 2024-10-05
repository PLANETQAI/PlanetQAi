import { connectToDatabase } from "@/lib/db";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";
const { ObjectId } = require("mongodb");

async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query; // Get the ID from the query parameters

  if (!id) {
    return res.status(400).json({ message: "ID is required" });
  }

  try {
    // Establish database connection
    const client = await connectToDatabase();
    const db = client.db();
    const galleryCollection = db.collection("gallery");

    // Get session to check if user is authenticated
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get the user's ID from the session
    const userId = session.user.id;

    // Delete the song with the specified ID for the authenticated user
    const result = await galleryCollection.deleteOne({ _id: new ObjectId(id), user: userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Song not found or not authorized to delete" });
    }

    // Return a success response
    res.status(200).json({ message: "Song deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error: Unable to delete song" });
  }
}

export default handler;
