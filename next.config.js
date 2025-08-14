/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable image optimization for Railway deployment
  images: {
    unoptimized: true,
    domains: ['localhost'],
  },
  
  // Ensure proper output for Railway
  output: 'standalone',
  
  // Disable telemetry
  telemetry: false,
  
  // Add experimental features that might help
  experimental: {
    // Enable app directory features
    appDir: true,
  },
  
  // Webpack configuration for Railway
  webpack: (config, { isServer }) => {
    // Add fallbacks for Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  
  // Environment variables that should be available at build time
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig 