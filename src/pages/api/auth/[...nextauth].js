// src/pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { compare } from 'bcryptjs';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        await connectDB();
        
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await User.findOne({ email: credentials.email });
        if (!user) return null;

        const isPasswordValid = await compare(credentials.password, user.password);
        if (!isPasswordValid) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        };
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub || token.userId;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google") {
        token.userId = user.id;
      }
      if (user) {
        token.userId = user.id;
      }
      return token;
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt"
  }
};

export default NextAuth(authOptions);