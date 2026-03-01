"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DownloadCloud, ArrowRight } from 'lucide-react';

export function UpdateBanner() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkUpdate = async () => {
            try {
                const res = await fetch('/api/system/update/status');
                if (res.ok) {
                    const data = await res.json();
                    if (data.status && data.status.updateAvailable) {
                        setUpdateAvailable(true);
                    } else {
                        setUpdateAvailable(false);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch update status", err);
            }
        };

        checkUpdate();
        // Poll every 10 seconds to match the backend lightweight ping
        const interval = setInterval(checkUpdate, 10000);
        return () => clearInterval(interval);
    }, []);

    if (!updateAvailable) return null;

    return (
        <div
            className="w-full bg-blue-600/90 text-white px-4 py-2 flex items-center justify-between text-sm shadow-md"
            style={{ zIndex: 9999, position: 'relative' }}
        >
            <div className="flex items-center gap-2">
                <DownloadCloud className="w-4 h-4 animate-bounce" />
                <span className="font-semibold">System Update verfügbar!</span>
                <span className="hidden sm:inline opacity-80">
                    Klicken Sie auf 'Zum Update', um die Details herunterzuladen.
                </span>
            </div>

            <button
                onClick={() => window.location.href = '/management-console'}
                className="flex items-center gap-1 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1 rounded text-xs font-medium"
            >
                Zum Update
                <ArrowRight className="w-3 h-3" />
            </button>
        </div>
    );
}
