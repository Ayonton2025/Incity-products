// src/pages/api/auth/logout.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Clear the NextAuth session token cookies
    res.setHeader("Set-Cookie", [
      `next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; httponly; secure=${process.env.NODE_ENV === "production"}`,
      `__Secure-next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; httponly; secure=true`
    ]);

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}