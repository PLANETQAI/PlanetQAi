// import { hash } from 'bcryptjs';
import { connectToDatabase } from "../../../lib/db";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { fullName, email, password } = req.body;

  if (
    !fullName ||
    !email ||
    !email.includes("@") ||
    !password ||
    password.trim().length < 6
  ) {
    return res.status(422).json({ message: "Invalid input" });
  }

  const client = await connectToDatabase();
  const db = client.db();

  const existingUser = await db.collection("login").findOne({ email });

  if (existingUser) {
    client.close();
    return res.status(422).json({ message: "User exists already!" });
  }

  // const hashedPassword = await hash(password, 12);

  const result = await db.collection("login").insertOne({
    fullName,
    email,
    password,
    role: "user",
    userType: "member",
    sessionId: null,
  });

  client.close();
  res.status(201).json({ message: "User created!" });
}

export default handler;
