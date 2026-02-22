const BACKEND_URL = 'http://127.0.0.1:3005/api';
const NEXT_API_URL = '/api';

/**
 * Fetches directly from the Backend (Port 3005).
 * Use this for high-frequency data (Accounts, Brokers, Mappings, History).
 * Bypasses Next.js Dev Server proxy to ensure <10ms latency.
 */
export async function fetchDirect(endpoint: string, options?: RequestInit) {
    // Ensure endpoint starts with / and remove it if double
    let cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // Fix Double API Issue: If Backend URL ends with /api and Path starts with /api, strip one.
    if (BACKEND_URL.endsWith('/api') && cleanPath.startsWith('/api/')) {
        cleanPath = cleanPath.substring(4);
    }

    const url = `${BACKEND_URL}${cleanPath}`;

    // Performance Trace
    const start = performance.now();
    console.log(`[PERF ${Date.now()}] [ClientAPI] 🟡 FETCH START: ${cleanPath}`);

    try {
        const res = await fetch(url, options);
        console.log(`[PERF ${Date.now()}] [ClientAPI] 🟢 FETCH END: ${cleanPath} (Status: ${res.status}, Duration: ${(performance.now() - start).toFixed(2)}ms)`);
        return res;
    } catch (e) {
        console.log(`[PERF ${Date.now()}] [ClientAPI] 🔴 FETCH ERROR: ${cleanPath} (Duration: ${(performance.now() - start).toFixed(2)}ms)`);
        throw e;
    }
}

/**
 * Fetches via Next.js API Routes.
 * Use this for System Actions (Updates, Recovery, Filesystem Checks) that rely on Next.js server logic.
 */
export async function fetchSystem(endpoint: string, options?: RequestInit) {
    const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${NEXT_API_URL}${cleanPath}`;
    return fetch(url, options);
}

/**
 * Common URLs for usage in fetching generic resources
 */
export const API_URLS = {
    DIRECT_BASE: 'http://127.0.0.1:3005',
    BACKEND_API: BACKEND_URL
};
