import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
    isVisible: boolean;
    status?: string;
    error?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, status = "Initializing Data...", error }) => {
    if (!isVisible) return null;

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-opacity duration-300">
            {error ? (
                <div className="flex flex-col items-center text-red-500 space-y-2 animate-in fade-in zoom-in duration-300">
                    <div className="p-3 rounded-full bg-red-500/10 border border-red-500/20">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <span className="font-semibold">{error}</span>
                </div>
            ) : (
                <div className="flex flex-col items-center text-blue-600 dark:text-blue-400 space-y-3 animate-in fade-in zoom-in duration-300">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <span className="text-sm font-medium tracking-wide text-gray-600 dark:text-gray-300 animate-pulse">
                        {status}
                    </span>
                </div>
            )}
        </div>
    );
};
