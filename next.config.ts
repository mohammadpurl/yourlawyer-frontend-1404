import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
  },
  output: 'standalone',
  // Ensure API routes are included in standalone build
  serverExternalPackages: [],
  images: {
    domains: ['localhost', '127.0.0.1'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yourlawyer.com',
      },
    ],
  },
};

export default nextConfig;
