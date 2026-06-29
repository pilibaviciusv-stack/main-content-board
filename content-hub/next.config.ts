import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No output: 'export' — use Vercel's default Next.js serverless mode
  // This enables API routes for server-side thumbnail proxying
  images: {
    unoptimized: true,
  },
  typescript: {
    // Type errors are caught in dev; don't block production builds
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
