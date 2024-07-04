import { connectToDatabase } from "../../../lib/db";

async function handler(req, res) {
  if (req.method !== "POST") {
    return;
  }

  const data = req.body;

  let { videoLink } = data;

  if (!videoLink) {
    res.status(422).json({
      message: "Link not entered",
    });
    return;
  }
  // console.log("old " + videoLink);
  if (videoLink.includes("spotify")) {
    const spotifyPart = videoLink.split(".com")[1];
    videoLink = `https://open.spotify.com/embed${spotifyPart}`;
  }

  //console.log("new " + videoLink);
  const client = await connectToDatabase();
  if (client) {
    const db = client.db();

    const existinglink = await db
      .collection("videolinks")
      .findOne({ link: videoLink });

    if (existinglink) {
      res
        .status(422)
        .json({ message: "Song with this link is already in database" });

      return;
    }

    const result = await db.collection("videolinks").insertOne({
      link: videoLink,
    });

    res.status(201).json({ message: "Link Stored Successfully!" });
  } else {
    console.error("Failed to connect to the database");
  }
}

export default handler;
