import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for App Engine deployment
  output: 'standalone',

  // Ensure static assets are properly handled
  // outputFileTracingRoot is no longer needed in Next.js 16+
};

export default nextConfig;
