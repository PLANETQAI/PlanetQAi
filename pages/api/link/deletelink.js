import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

async function handler(req, res) {
  if (req.method !== "DELETE") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const session = await getServerSession(req, res, authOptions);

  // Check if the user is authenticated
  if (!session) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  // Check if the user is an admin
  const isAdmin = session.user.role === "admin";
  if (!isAdmin) {
    res.status(403).json({ message: "Forbidden: You do not have permission to perform this action" });
    return;
  }

  const { songId } = req.body;

  if (!songId) {
    res.status(400).json({ message: "Bad Request: songId is required" });
    return;
  }

  try {
    const client = await connectToDatabase();
    const linkCollection = client.db().collection("videolinks");

    const result = await linkCollection.deleteOne({ _id: new ObjectId(songId) });

    if (result.deletedCount === 0) {
      res.status(404).json({ message: "Song not found" });
      return;
    }

    res.status(200).json({
      message: "Successfully deleted the song",
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      message: "Internal Server Error: Unable to delete the song",
    });
  }
}

export default handler;
