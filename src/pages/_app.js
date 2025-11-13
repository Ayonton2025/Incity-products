// src/pages/_app.js
import '@/styles/globals.css';
import { SessionProvider, useSession } from 'next-auth/react';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

// Authentication guard for protecting routes
function AuthGuard({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect only when not authenticated and not already on auth pages
    if (
      status === 'unauthenticated' &&
      !['/auth/signin', '/auth/register'].includes(router.pathname)
    ) {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Show loading while session is being fetched
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white text-lg">
        Checking authentication...
      </div>
    );
  }

  // Prevent rendering protected content before redirect
  if (status === 'unauthenticated' &&
      !['/auth/signin', '/auth/register'].includes(router.pathname)) {
    return null;
  }

  return children;
}

export default function App({ Component, pageProps }) {
  return (
    <SessionProvider session={pageProps.session}>
      <Script src="/global.js" strategy="beforeInteractive" />
      <AuthGuard>
        <Component {...pageProps} />
      </AuthGuard>
    </SessionProvider>
  );
}
