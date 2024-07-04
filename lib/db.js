import { MongoClient } from "mongodb";
const { ObjectId } = require("mongodb");

export async function connectToDatabase() {
  let client;

  const connectionString = `mongodb+srv://${process.env.mongodb_username}:${process.env.mongodb_password}@${process.env.mongodb_clustername}.psik2ae.mongodb.net/${process.env.mongodb_database}?retryWrites=true&w=majority`;

  try {
    client = new MongoClient(connectionString, {
      connectTimeoutMS: 600000,
      serverSelectionTimeoutMS: 60000,
    });
    console.log("Connecting to MongoDB Atlas cluster...");
    await client.connect();
    console.log("Successfully connected to MongoDB Atlas!");

    return client;
  } catch (error) {
    console.error("Connection to MongoDB Atlas failed!", error);
    process.exit();
  }
}

