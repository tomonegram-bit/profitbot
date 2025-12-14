/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3001',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'your-secret-key',
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  // Allow public access - listen on all interfaces
  publicRuntimeConfig: {
    apiUrl: process.env.BACKEND_URL || 'http://localhost:3000',
  },
  serverRuntimeConfig: {
    apiUrl: process.env.BACKEND_URL || 'http://localhost:3000',
  },
}

module.exports = nextConfig