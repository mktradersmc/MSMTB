import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Awesome Cockpit',
        short_name: 'Cockpit',
        description: 'Advanced Trading Interface',
        start_url: '/',
        display: 'standalone',
        background_color: '#020617', // slate-950
        theme_color: '#0f172a', // slate-900
        icons: [
            {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
