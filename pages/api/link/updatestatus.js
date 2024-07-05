import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

async function handler(req, res) {
  if (req.method !== "PUT") {
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

  const { songId, newStatus } = req.body;

  if (!songId || !newStatus) {
    res.status(400).json({ message: "Bad Request: songId and newStatus are required" });
    return;
  }

  try {
    const client = await connectToDatabase();
    const linkCollection = client.db().collection("videolinks");

    const result = await linkCollection.updateOne(
      { _id: new ObjectId(songId) },
      { $set: { status: newStatus } }
    );

    if (result.modifiedCount === 0) {
      res.status(404).json({ message: "Song not found" });
      return;
    }

    res.status(200).json({
      message: "Successfully updated the song status",
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      message: "Internal Server Error: Unable to update the song status",
    });
  }
}

export default handler;
