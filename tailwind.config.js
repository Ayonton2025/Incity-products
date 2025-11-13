/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './node_modules/react-leaflet/**/*.{js,jsx,ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "sm": "640px",
        "md": "768px",
        "lg": "1024px",
        "xl": "1280px",
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Bot-specific colors for better visual distinction
        bot: {
          health: "hsl(142, 76%, 36%)",      // Green for Health Bot
          finance: "hsl(217, 91%, 60%)",     // Blue for Finance Bot
          recipes: "hsl(34, 100%, 50%)",     // Orange for Recipes Bot
          commute: "hsl(262, 83%, 58%)",     // Purple for Commute Bot
          weather: "hsl(190, 90%, 50%)",     // Cyan for Weather Bot
          products: "hsl(330, 81%, 60%)",    // Pink for Products Bot
          places: "hsl(45, 100%, 51%)",      // Yellow for Places Bot
          events: "hsl(160, 84%, 39%)",      // Teal for Events Bot
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Map-specific colors
        map: {
          primary: "#3b82f6",      // Blue for primary map elements
          secondary: "#6b7280",    // Gray for secondary elements
          success: "#10b981",      // Green for successful routes
          warning: "#f59e0b",      // Yellow for warnings
          danger: "#ef4444",       // Red for errors/danger
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      // Enhanced keyframes for better animations
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          from: { opacity: "1", transform: "translateY(0)" },
          to: { opacity: "0", transform: "translateY(10px)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200px 0" },
          "100%": { backgroundPosition: "200px 0" },
        },
        // Bot-specific animations
        "bot-typing": {
          "0%, 60%, 100%": { transform: "scaleY(0.5)", opacity: "0.5" },
          "30%": { transform: "scaleY(1)", opacity: "1" },
        },
        "map-marker-pulse": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.1)", opacity: "0.8" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-out-right": "slide-out-right 0.3s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "bounce-soft": "bounce-soft 1s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "bot-typing": "bot-typing 1.5s ease-in-out infinite",
        "map-marker-pulse": "map-marker-pulse 2s ease-in-out infinite",
      },
      // Custom background images for different bots
      backgroundImage: {
        'health-pattern': "url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"%239C92AC\" fill-opacity=\"0.05\" fill-rule=\"evenodd\"%3E%3Ccircle cx=\"3\" cy=\"3\" r=\"3\"/%3E%3Ccircle cx=\"13\" cy=\"13\" r=\"3\"/%3E%3C/g%3E%3C/svg%3E')",
        'finance-pattern': "url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"%239C92AC\" fill-opacity=\"0.05\" fill-rule=\"evenodd\"%3E%3Cpath d=\"M0 0h20v20H0z\"/%3E%3C/g%3E%3C/svg%3E')",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      // Custom spacing for chat interfaces
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Custom max-width for different content types
      maxWidth: {
        'chat-message': 'min(28rem, 95vw)',
        'map-container': '90rem',
        'bot-card': '24rem',
      },
      // Custom min-height for containers
      minHeight: {
        'chat-container': '32rem',
        'map-min': '24rem',
      },
      // Box shadow for depth
      boxShadow: {
        'bot': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'bot-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'map': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      // Z-index hierarchy
      zIndex: {
        'map': '10',
        'map-controls': '20',
        'chat': '30',
        'modal': '40',
        'dropdown': '50',
        'tooltip': '60',
      },
      // Font families
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require('@tailwindcss/typography'),
    // Custom plugin for bot-specific utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Bot message styles
        '.bot-message-health': {
          backgroundColor: theme('colors.bot.health'),
          color: 'white',
        },
        '.bot-message-finance': {
          backgroundColor: theme('colors.bot.finance'),
          color: 'white',
        },
        '.bot-message-recipes': {
          backgroundColor: theme('colors.bot.recipes'),
          color: 'white',
        },
        '.bot-message-commute': {
          backgroundColor: theme('colors.bot.commute'),
          color: 'white',
        },
        '.bot-message-weather': {
          backgroundColor: theme('colors.bot.weather'),
          color: 'white',
        },
        '.bot-message-products': {
          backgroundColor: theme('colors.bot.products'),
          color: 'white',
        },
        '.bot-message-places': {
          backgroundColor: theme('colors.bot.places'),
          color: 'white',
        },
        '.bot-message-events': {
          backgroundColor: theme('colors.bot.events'),
          color: 'white',
        },
        // Map container utilities
        '.map-container': {
          height: '400px',
          width: '100%',
          borderRadius: theme('borderRadius.lg'),
          overflow: 'hidden',
        },
        '.leaflet-container': {
          height: '100%',
          width: '100%',
          borderRadius: 'inherit',
        },
        // Chat container utilities
        '.chat-container': {
          height: '600px',
          maxHeight: '70vh',
          overflowY: 'auto',
          scrollBehavior: 'smooth',
        },
        // Loading states
        '.loading-shimmer': {
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200px 100%',
          animation: 'shimmer 2s linear infinite',
        },
      }
      addUtilities(newUtilities, ['responsive', 'hover'])
    }
  ],
  // Safelist for dynamic classes used in the application
  safelist: [
    // Bot message colors
    'bg-bot-health',
    'bg-bot-finance', 
    'bg-bot-recipes',
    'bg-bot-commute',
    'bg-bot-weather',
    'bg-bot-products',
    'bg-bot-places',
    'bg-bot-events',
    // Text colors for bots
    'text-bot-health',
    'text-bot-finance',
    'text-bot-recipes', 
    'text-bot-commute',
    'text-bot-weather',
    'text-bot-products',
    'text-bot-places',
    'text-bot-events',
    // Border colors for bots
    'border-bot-health',
    'border-bot-finance',
    'border-bot-recipes',
    'border-bot-commute',
    'border-bot-weather',
    'border-bot-products',
    'border-bot-places',
    'border-bot-events',
    // Animation classes
    'animate-bot-typing',
    'animate-map-marker-pulse',
    // Grid classes for responsive layouts
    'grid-cols-1',
    'grid-cols-2',
    'grid-cols-3',
    'md:grid-cols-2',
    'md:grid-cols-3',
    'lg:grid-cols-4',
    // Map-related classes
    'leaflet-container',
    'leaflet-popup',
    'leaflet-marker-icon',
    'leaflet-marker-shadow',
  ],
}