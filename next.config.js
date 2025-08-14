/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable image optimization for Railway deployment
  images: {
    unoptimized: true,
    domains: ['localhost'],
  },
  
  // Railway deployment configuration
  // output: 'standalone', // Commented out - causes start issues
  
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
}

module.exports = nextConfig 