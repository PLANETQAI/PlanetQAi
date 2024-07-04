import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "../../../lib/db";

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
          userType: user.userType,
          sessionId: user.sessionId,
        };
      },
    }),
  ],

  session: {
    maxAge: 30 * 60, // Set maxAge to 10 seconds
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      console.log(trigger);
      if (trigger === "update" && session?.userType) {
        token.userType = session.userType;
        token.sessionId = session.sessionId;
      }


      if (user) {
        token.id = user.id;
        token.userType = user.userType;
        token.sessionId = user.sessionId;
      }


      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.userType = token.userType;
        session.user.sessionId = token.sessionId;
      }


      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
export default NextAuth(authOptions);
