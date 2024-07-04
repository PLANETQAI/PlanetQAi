
import { connectToDatabase } from "../../../lib/db";

async function handler(req, res) {
  if (req.method !== "PATCH") {
    return;
  }


  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;

  const client = await connectToDatabase();

  const usersCollection = client.db().collection("login");

  const user = await usersCollection.findOne({ password: oldPassword });

  if (!user) {
    res.status(404).json({ message: "Your old password is incorrect!" });

    return;
  }


  if (!newPassword || newPassword.trim().length < 7) {
    res.status(422).json({
      message:
        "Invalid - new password should be at least 7 characters.",
    });
    return;
  }


  const result = await usersCollection.updateOne(
    { password: oldPassword },
    { $set: { password: newPassword } }
  );


  res.status(200).json({ message: "Password updated!" });
}

export default handler;
