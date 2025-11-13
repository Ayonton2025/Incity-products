// src/components/Layout/Layout.js
import Header from './Header';

export default function Layout({ children, currentPage = "Home" }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage={currentPage} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}