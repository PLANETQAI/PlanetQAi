import { connectToDatabase } from "@/lib/db";

async function handler(req, res) {
  if (req.method !== "GET") {
    return;
  } else {
    try {
        
      const client = await connectToDatabase();

      const usersCollection = client.db().collection("videolinks");

      const allVideoLinks = await usersCollection
        .find({}, { projection: { _id: 0 } })
        .toArray();
      res.status(200).json(allVideoLinks);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({
        message: "Internal Server Error: Unable to get music",
      });
    }
  }
}

export default handler;
