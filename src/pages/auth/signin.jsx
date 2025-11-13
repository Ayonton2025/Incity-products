// src/pages/auth/signin.jsx
import { getProviders, signIn } from "next-auth/react";
import { useState } from "react";

export default function SignIn({ providers }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleCredentialsLogin = async (e) => {
    e.preventDefault();
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result.error) {
      setError("Invalid email or password");
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-3xl mb-6">Sign in to Incity</h1>

      {/* Google OAuth */}
      {providers?.google && (
        <button
          onClick={() => signIn("google")}
          className="mb-4 px-6 py-3 bg-red-600 rounded-lg hover:bg-red-700"
        >
          Sign in with Google
        </button>
      )}

      <div className="my-4 text-gray-400">OR</div>

      <form onSubmit={handleCredentialsLogin} className="w-80">
        {error && <p className="text-red-400 mb-2">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-3 rounded bg-gray-800"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-4 rounded bg-gray-800"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 py-2 rounded hover:bg-blue-700"
        >
          Sign In
        </button>
      </form>

      <p className="mt-4 text-gray-400">
        Don't have an account?{" "}
        <a href="/auth/register" className="text-blue-400">Register</a>
      </p>
    </div>
  );
}

export async function getServerSideProps() {
  const providers = await getProviders();
  return { props: { providers } };
}
