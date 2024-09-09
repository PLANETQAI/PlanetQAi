import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "../../../lib/db";
import { ObjectId } from "mongodb";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",

      async authorize(credentials) {
        const client = await connectToDatabase();
        const usersCollection = client.db().collection("login");

        const user = await usersCollection.findOne({
          email: credentials.email,
        });

        if (!user) {
          throw new Error("User does not exist with this gmail");
        }

        const isValid = await usersCollection.findOne({
          password: credentials.password,
        });

        if (!isValid) {
          throw new Error("Incorrect password!");
        }

        return {
          id: user._id,
          email: user.email,
          max_download: user.max_download,
          // userType: user.userType,
          // sessionId: user.sessionId,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    maxAge: 30 * 60, // Set maxAge to 10 seconds
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.max_download) {
        token.max_download = session.max_download
        // token.userType = session.userType;
        // token.sessionId = session.sessionId;
      }

      if (user) {
        token.id = user.id;
        token.max_download = user.max_download;
        // token.userType = user.userType;
        // token.sessionId = user.sessionId;
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.max_download = token.max_download;
        // session.user.userType = token.userType;
        // session.user.sessionId = token.sessionId;
        session.user.role = token.role;
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
export default NextAuth(authOptions);
