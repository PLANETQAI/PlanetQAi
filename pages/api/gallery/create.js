import { connectToDatabase } from "../../../lib/db";

async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const data = req.body;
  let { user, audioLink } = data;

  if (!user) {
    res.status(422).json({ message: "User is required!" });
    return;
  }

  if (!audioLink) {
    res.status(422).json({ message: "Link not entered" });
    return;
  }
  
  const client = await connectToDatabase();
  const db = client.db();

  const result = await db.collection("gallery").insertOne({
    user,
    audioLink,
    isPaid: false,
  });

  res.status(201).json({ message: "Music created Successfully!" });
}

export default handler;
