import type { NextConfig } from "next";
import fs from 'fs';
import path from 'path';

const isLegacy = process.env.NEXT_COMPILER_MODE === 'legacy';

// Dynamically determine protocol based on system.json
let backendScheme = 'https';
try {
  const configPath = path.resolve(process.cwd(), '../market-data-core/data/system.json');
  if (fs.existsSync(configPath)) {
    const sysConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (sysConfig?.backend?.useSSL === false) {
      backendScheme = 'http';
    }
  }
} catch (e) {
  console.error('[Next.js Config] Failed to read system.json for rewrite rule, defaulting to https', e);
}

// FIX: Next.js internal proxy strictly rejects self-signed certificates.
// If we are forcing HTTPS for local traffic, we must allow self-signed certs globally for this process.
if (backendScheme === 'https') {
  console.log('[Next.js Config] Enforcing NODE_TLS_REJECT_UNAUTHORIZED=0 for internal self-signed SSL proxying.');
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: '/api/mappings',
        destination: `${backendScheme}://localhost:3005/api/mappings`,
      },
      {
        source: '/api/broker-symbols/:path*',
        destination: `${backendScheme}://localhost:3005/api/broker-symbols/:path*`,
      },
      {
        source: '/api/distribution/config',
        destination: `${backendScheme}://localhost:3005/api/distribution/config`,
      },
      {
        source: '/api/distribution/execute',
        destination: `${backendScheme}://localhost:3005/api/distribution/execute`,
      },
      {
        source: '/api/system/update/:path*',
        destination: `${backendScheme}://localhost:3006/api/system/update/:path*`,
      },
      {
        source: '/management-console',
        destination: `${backendScheme}://localhost:3006/`,
      },
      {
        source: '/management-console/:path*',
        destination: `${backendScheme}://localhost:3006/:path*`,
      },
    ];
  },
};

export default nextConfig;
