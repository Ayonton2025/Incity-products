// src/components/Layout/Header.js
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { 
  FiLogOut, 
  FiUser, 
  FiMenu, 
  FiX,
  FiHome,
  FiHeart,
  FiDollarSign,
  FiNavigation,
  FiCloud,
  FiShoppingBag,
  FiMapPin,
  FiCalendar
} from "react-icons/fi";

export default function Header({ currentPage = "Home" }) {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  };

  const navigationItems = [
    { name: "Home", href: "/", icon: FiHome },
    { name: "Health", href: "/health", icon: FiHeart },
    { name: "Finance", href: "/finance", icon: FiDollarSign },
    { name: "Recipes", href: "/recipes", icon: FiHeart },
    { name: "Commute", href: "/commute", icon: FiNavigation },
    { name: "Weather", href: "/weather", icon: FiCloud },
    { name: "Products", href: "/products", icon: FiShoppingBag },
    { name: "Places", href: "/places", icon: FiMapPin },
    { name: "Events", href: "/events", icon: FiCalendar },
  ];

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-800">Incity</h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:ml-6 md:flex md:space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      currentPage === item.name
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            {/* User Info */}
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
              <FiUser className="w-4 h-4" />
              <span>Welcome, {session?.user?.name || session?.user?.email}</span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <FiLogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-2">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors ${
                      currentPage === item.name
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </a>
                );
              })}
              
              {/* Mobile User Info */}
              <div className="px-3 py-2 text-sm text-gray-500 border-t border-gray-200 mt-2">
                Signed in as: {session?.user?.email}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}