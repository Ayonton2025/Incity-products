/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  
  // Enable environment variables for client-side usage
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Image optimization configuration
  images: {
    domains: [
      'cdnjs.cloudflare.com',
      'raw.githubusercontent.com',
      'tile.openstreetmap.org',
      'a.tile.openstreetmap.org',
      'b.tile.openstreetmap.org',
      'c.tile.openstreetmap.org',
      'unpkg.com'
    ],
    unoptimized: process.env.NODE_ENV === 'development', // Disable optimization in development for faster builds
  },

  // Enable SWC minification for better performance
  swcMinify: true,

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console.log in production
  },

  // Experimental features (enable for better performance)
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // Headers for security and CORS
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXTAUTH_URL || 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Fix for Leaflet marker icons
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // Handle node modules that might cause issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false,
    };

    return config;
  },

  // Development-specific configuration
  ...(process.env.NODE_ENV === 'development' && {
    webpackDevMiddleware: (config) => {
      config.watchOptions = {
        ignored: [
          '**/node_modules/**',
          '**/.next/**',
          path.resolve('C:\\pagefile.sys'),
          path.resolve('C:\\swapfile.sys'),
          path.resolve('C:\\System Volume Information'),
          path.resolve('C:\\hiberfil.sys'),
          path.resolve('C:\\DumpStack.log.tmp'),
          '**/public/maps/**', // Ignore map cache files
        ],
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay rebuild
      };
      return config;
    },
  }),

  // Production-specific configuration
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone', // For better deployment
    compress: true,
    generateEtags: true,
  }),
};

module.exports = nextConfig;