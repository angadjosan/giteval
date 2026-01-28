import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for App Engine deployment
  output: 'standalone',

  // Ensure static assets are properly handled
  // outputFileTracingRoot is no longer needed in Next.js 16+

  // Proxy /api/* requests to backend service
  async rewrites() {
    const backendUrl = process.env.BACKEND_SERVICE_URL || 'https://backend-dot-giteval.uc.r.appspot.com';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
