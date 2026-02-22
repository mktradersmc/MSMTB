import React, { useState } from 'react'; // Added useState for dismissal if needed, but keeping simple for now
import { Wifi, WifiOff, RefreshCw, AlertCircle, AlertTriangle } from 'lucide-react'; // Added Icons
import { useChartTheme } from '../../context/ChartThemeContext';

export type SyncStatus = 'OFFLINE' | 'READY' | 'ONLINE' | 'ERROR' | 'PARTIAL' | 'REJECTED';

interface ChartStatusIndicatorProps {
    status: SyncStatus;
    message?: string;
    className?: string;
}

export const ChartStatusIndicator: React.FC<ChartStatusIndicatorProps> = ({ status, message, className = "" }) => {
    const { mode } = useChartTheme();
    const isDark = mode === 'dark';

    let content = null;
    // Toast / Card Style (Micro)
    let containerClass = "flex items-center gap-2 px-2 py-1.5 rounded-lg border shadow-lg backdrop-blur-md transition-all duration-300 select-none"; // Minimal padding
    let iconClass = "";
    let textClass = "flex flex-col";
    let titleClass = "text-[11px] font-bold leading-none tracking-wide";
    let subClass = "text-[9px] font-medium opacity-60 leading-tight mt-0.5 truncate max-w-[120px]"; // Added truncate

    // Explicit Styles based on Chart Theme Mode (ignoring App Global Theme)
    switch (status) {
        case 'OFFLINE':
        case 'READY':
        case 'ONLINE':
            return null;
        case 'ERROR':
            if (isDark) {
                containerClass += " bg-red-950/90 border-red-500/30 shadow-red-900/20";
                iconClass = "text-red-500";
            } else {
                containerClass += " bg-red-50/90 border-red-200 shadow-red-500/10";
                iconClass = "text-red-600";
            }
            content = (
                <>
                    <div className={`p-1 rounded-md ${isDark ? 'bg-red-500/10' : 'bg-red-100'} ${iconClass}`}>
                        <AlertCircle size={14} strokeWidth={2.5} />
                    </div>
                    <div className={textClass}>
                        <span className={`${titleClass} ${isDark ? 'text-red-100' : 'text-red-900'}`}>ERROR</span>
                        <span className={`${subClass} ${isDark ? 'text-red-200/70' : 'text-red-700/70'}`} title={message}>{message || 'Execution Failed'}</span>
                    </div>
                </>
            );
            break;
        case 'PARTIAL':
            if (isDark) {
                containerClass += " bg-orange-950/90 border-orange-500/30 shadow-orange-900/20";
                iconClass = "text-orange-500";
            } else {
                containerClass += " bg-orange-50/90 border-orange-200 shadow-orange-500/10";
                iconClass = "text-orange-600";
            }
            content = (
                <>
                    <div className={`p-1 rounded-md ${isDark ? 'bg-orange-500/10' : 'bg-orange-100'} ${iconClass}`}>
                        <AlertTriangle size={14} strokeWidth={2.5} />
                    </div>
                    <div className={textClass}>
                        <span className={`${titleClass} ${isDark ? 'text-orange-100' : 'text-orange-900'}`}>PARTIAL</span>
                        <span className={`${subClass} ${isDark ? 'text-orange-200/70' : 'text-orange-700/70'}`} title={message}>{message || 'Partial Fill'}</span>
                    </div>
                </>
            );
            break;
        case 'REJECTED':
            if (isDark) {
                containerClass += " bg-slate-800/90 border-slate-600/50 shadow-slate-900/20";
                iconClass = "text-yellow-500";
            } else {
                containerClass += " bg-slate-100/90 border-slate-300 shadow-slate-300/10";
                iconClass = "text-yellow-600";
            }
            content = (
                <>
                    <div className={`p-1 rounded-md ${isDark ? 'bg-yellow-500/10' : 'bg-yellow-100'} ${iconClass}`}>
                        <AlertCircle size={14} strokeWidth={2.5} />
                    </div>
                    <div className={textClass}>
                        <span className={`${titleClass} ${isDark ? 'text-yellow-100' : 'text-slate-900'}`}>REJECTED</span>
                        <span className={`${subClass} ${isDark ? 'text-yellow-200/70' : 'text-slate-600/70'}`} title={message}>{message || 'Order Rejected'}</span>
                    </div>
                </>
            );
            break;
    }

    if (!content) return null;

    return (
        <div className={`${containerClass} ${className} animate-in slide-in-from-top-2 duration-300`}>
            {content}
        </div>
    );
};
