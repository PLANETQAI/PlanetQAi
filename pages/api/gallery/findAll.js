import { connectToDatabase } from "@/lib/db";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
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

    // Find all galleries for the authenticated user
    const galleries = await galleryCollection
      .find({ user: userId })
      .toArray();

    // Return the found galleries
    res.status(200).json(galleries);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error: Unable to fetch galleries" });
  }
}

export default handler;
