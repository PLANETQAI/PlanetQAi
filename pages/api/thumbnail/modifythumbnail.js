import { connectToDatabase } from "@/lib/db";

async function handler(req, res) {
  if (req.method === "DELETE") {
    try {
      const client = await connectToDatabase();

      const linkCollection = client.db().collection("Thumbnail");
      const count = await linkCollection.countDocuments();

      if (count === 0) {
        return res.status(200).json({
          message: "No thumbnail is available to delete",
        });
      }

      const result = await linkCollection.deleteMany({});

      res.status(200).json({
        message: `Successfully deleted ${result.deletedCount} Thumbnail`,
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error: Unable to delete thumbnail picture",
      });
    }
  } else if (req.method === "POST") {
    const data = req.body;

    const { ThumbnailImage } = data;

    if (!ThumbnailImage) {
      return res.status(200).json({
        message: "Please Upload a thumbnail image.",
      });
    }

    const client = await connectToDatabase();
    if (client) {
      const db = client.db();

      const linkCollection = db.collection("Thumbnail");
      const count = await linkCollection.countDocuments();

      if (count === 1) {
        return res.status(200).json({
          message:
            "Please delete previous thumbnail first to upload a new one.",
        });
      }

      const existingThumbnail = await linkCollection.findOne({
        ThumbnailImage,
      });

      if (existingThumbnail) {
        res.status(422).json({ message: "This thumbnail already exists." });
        return;
      }

      const result = await linkCollection.insertOne({ ThumbnailImage });

      res.status(201).json({ message: "Thumbnail Updated!" });
    } else {
      console.error("Failed to connect to the database");
    }
  } else if (req.method === "GET") {
    try {
      const client = await connectToDatabase();
      const db = client.db();
      const thumbnailCollection = db.collection("Thumbnail");
      const count = await thumbnailCollection.countDocuments();

      if (count === 0) {
        return res.status(200).json({
          message: "no thumbnail is available",
        });
      }

      const newThumbnail = await thumbnailCollection
        .find({}, { projection: { _id: 0 } })
        .toArray();

      res.status(200).json(newThumbnail);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({
        message: "Internal Server Error: Unable to get music",
      });
    }
  } else {
    return;
  }
}

export default handler;
