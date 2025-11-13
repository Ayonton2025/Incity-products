// src/pages/auth/logout.js
import { useEffect } from "react";
import { useRouter } from "next/navigation"; // Changed from 'next/router' to 'next/navigation'
import { signOut } from "next-auth/react";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Sign out from NextAuth
        await signOut({ redirect: false });
        
        // Clear server session
        await fetch("/api/auth/logout", { 
          method: "POST" 
        });
        
        // Redirect to homepage
        router.push("/");
      } catch (error) {
        console.error("Logout error:", error);
        router.push("/");
      }
    };

    performLogout();
  }, [router]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <p>Logging out...</p>
    </div>
  );
}