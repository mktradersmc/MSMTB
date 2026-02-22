import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/mappings',
        destination: 'http://127.0.0.1:3005/api/mappings',
      },
      {
        source: '/api/broker-symbols/:path*',
        destination: 'http://127.0.0.1:3005/api/broker-symbols/:path*',
      },
      {
        source: '/api/distribution/config',
        destination: 'http://127.0.0.1:3005/api/distribution/config',
      },
      {
        source: '/api/distribution/execute',
        destination: 'http://127.0.0.1:3005/api/distribution/execute',
      },
      // Proxy other legacy endpoints if needed, but be careful of collisions
      // {
      //   source: '/api/legacy/:path*',
      //   destination: 'http://127.0.0.1:3005/:path*',
      // }
    ];
  },
};

export default nextConfig;
