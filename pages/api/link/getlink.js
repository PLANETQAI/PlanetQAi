import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  try {
    const client = await connectToDatabase();
    const db = client.db();
    const videoLinksCollection = db.collection("videolinks");
    const usersCollection = db.collection("login");

    // Get session to check if user is authenticated
    const session = await getServerSession(req, res, authOptions);

    // Fetch all video links
    let videoLinks;
    if (session) {
      const isAdmin = session.user.role === "admin";
      if (isAdmin) {
        videoLinks = await videoLinksCollection.find({}).toArray();
      } else {
        videoLinks = await videoLinksCollection.find({ status: "active" }).toArray();
      }
    } else {
      videoLinks = await videoLinksCollection.find({ status: "active" }).toArray();
    }

    const populatedVideoLinks = await Promise.all(
      videoLinks.map(async (videoLink) => {
        const user = await usersCollection.findOne({ _id: new ObjectId(videoLink.user) });

        if (user) {
          const { password, ...userWithoutPassword } = user;

          return {
            ...videoLink,
            user: userWithoutPassword,
          };
        }

        return videoLink;
      })
    );

    res.status(200).json(populatedVideoLinks);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error: Unable to get music" });
  }
}

export default handler;
