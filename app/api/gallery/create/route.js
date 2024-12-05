import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/db";

export async function POST(req, res) {
  const data = req.body;
  let { user, audioLink } = data;

  if (!user) {
    return NextResponse.json({ message: 'User is required!' }, { status: 422 })
  }

  if (!audioLink) {
    return NextResponse.json({ message: 'Link not entered' }, { status: 422 })
  }

  const client = await connectToDatabase();
  const db = client.db();

  const result = await db.collection("gallery").insertOne({
    user,
    audioLink,
    isPaid: false,
  });

  return NextResponse.json({ message: 'Music created Successfully!' }, { status: 201 })
}

