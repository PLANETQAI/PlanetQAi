import { connectToDatabase } from "../../../lib/db";

async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const data = req.body;
  let { videoLink, user, title, thumbnail } = data;

  if (!user) {
    res.status(422).json({ message: "User is required!" });
    return;
  }

  if (!videoLink) {
    res.status(422).json({ message: "Link not entered" });
    return;
  }

  // if (!thumbnail) {
  //   res.status(422).json({ message: "Thumbnail link not entered" });
  //   return;
  // }

  // Basic URL format validation
  const urlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com|spotify\.com)\/.+$/;
  const imagePattern = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/;
  
  if (!urlPattern.test(videoLink)) {
    res.status(422).json({ message: "Invalid video link format!" });
    return;
  }

  // if (!imagePattern.test(thumbnail)) {
  //   res.status(422).json({ message: "Invalid thumbnail link format!" });
  //   return;
  // }

  // Transform Spotify link
  if (videoLink.includes("spotify")) {
    const spotifyPart = videoLink.split(".com")[1];
    videoLink = `https://open.spotify.com/embed${spotifyPart}`;
  }

  const client = await connectToDatabase();
  if (!client) {
    res.status(500).json({ message: "Failed to connect to the database" });
    return;
  }

  const db = client.db();
  const existingLink = await db.collection("videolinks").findOne({ link: videoLink });

  if (existingLink) {
    res.status(422).json({ message: "Song with this link is already in database" });
    return;
  }

  const result = await db.collection("videolinks").insertOne({
    user,
    status: "pending",
    link: videoLink,
    title,
    thumbnail: "https://cdn1.suno.ai/image_d552114f-0ba9-4015-be3b-6b0effd3db9b.png",
  });

  res.status(201).json({ message: "Link Stored Successfully!" });
}

export default handler;
