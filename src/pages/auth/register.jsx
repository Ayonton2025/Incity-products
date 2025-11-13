// src/pages/auth/register.jsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await res.json();

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push('/auth/signin'), 1500);
    } else {
      setError(data.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg w-96">
        <h2 className="text-2xl mb-6 text-white text-center">Create Account</h2>
        {success ? (
          <p className="text-green-400 text-center">
            Account created! Redirecting to sign in...
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <p className="text-red-400 mb-4">{error}</p>}
            <input
              type="text"
              placeholder="Full name"
              className="w-full p-3 mb-4 rounded bg-gray-700 text-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 mb-4 rounded bg-gray-700 text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 mb-6 rounded bg-gray-700 text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 py-3 rounded hover:bg-blue-700 text-white"
            >
              Register
            </button>
          </form>
        )}
        <p className="mt-4 text-gray-400 text-center">
          Already have an account?{' '}
          <a href="/auth/signin" className="text-blue-400">Sign in</a>
        </p>
      </div>
    </div>
  );
}
