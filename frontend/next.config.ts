import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for App Engine deployment
  output: 'standalone',

  // Ensure static assets are properly handled
  experimental: {
    outputFileTracingRoot: undefined,
  },
};

export default nextConfig;
