import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: isProd ? 'export' : undefined,
  distDir: isProd ? '../public' : '.next',
  // In development, proxy API calls to the local Express backend
  async rewrites() {
    if (isProd) return [];
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:3006/api/:path*'
      }
    ];
  }
};

export default nextConfig;
