import { connectToDatabase } from "@/lib/db";

async function handler(req, res) {
  if (req.method !== "DELETE") {
    return;
  } else {
    try {
      const client = await connectToDatabase();

      const linkCollection = client.db().collection("videolinks");
      const count = await linkCollection.countDocuments();

      // If there are no documents, return a message
      if (count === 0) {
        return res.status(200).json({
          message: "No links available to delete",
        });
      }

      const result = await linkCollection.deleteMany({});

      res.status(200).json({
        message: `Successfully deleted ${result.deletedCount} video links`,
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      //console.error("Error:", error);
      res.status(500).json({
        message: "Internal Server Error: Unable to delete video links",
      });
    }
  }
}

export default handler;
