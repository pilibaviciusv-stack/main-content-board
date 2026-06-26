import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No output: 'export' — use Vercel's default Next.js serverless mode
  // This enables API routes for server-side thumbnail proxying
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
