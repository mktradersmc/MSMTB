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

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: '/api/mappings',
        destination: `${backendScheme}://127.0.0.1:3005/api/mappings`,
      },
      {
        source: '/api/broker-symbols/:path*',
        destination: `${backendScheme}://127.0.0.1:3005/api/broker-symbols/:path*`,
      },
      {
        source: '/api/distribution/config',
        destination: `${backendScheme}://127.0.0.1:3005/api/distribution/config`,
      },
      {
        source: '/api/distribution/execute',
        destination: `${backendScheme}://127.0.0.1:3005/api/distribution/execute`,
      },
    ];
  },
};

export default nextConfig;
