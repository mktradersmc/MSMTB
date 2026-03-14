import React, { useEffect, useState, useRef } from 'react';
import { NewsEvent } from '../plugins/NewsMarkerPrimitive';
import { X, Calendar, Clock } from 'lucide-react';

interface NewsPopupOverlayProps {
    events: NewsEvent[] | null;
    x: number;
    y: number;
    onClose: () => void;
}

export function NewsPopupOverlay({ events, x, y, onClose }: NewsPopupOverlayProps) {
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (Date.now() - ((window as any)._lastNewsMarkerClickTime || 0) < 50) return;
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        // Use a slight delay before attaching the listener so the click that opened the popup doesn't immediately close it.
        if (events && events.length > 0) {
            setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 10);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [events, onClose]);

    if (!events || events.length === 0) return null;

    console.log("[NewsPopupOverlay] RENDERING POPUP AT X:", x, "Y:", y, "EVENTS:", events.length);

    return (
        <div 
            ref={popupRef}
            className="fixed z-[100] flex flex-col justify-end pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200"
            style={{ 
                left: Math.min(x - 140, window.innerWidth - 300), // Center above marker
                bottom: window.innerHeight - y + 16, // Stack upwards from marker
                maxHeight: '80vh',
                overflowY: 'auto'
            }}
        >
            {events.map((event, idx) => {
                const dt = new Date(event.timestamp * 1000);
                const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = dt.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

                // Simplify Impact
                let compactImpact = 'Non-Eco';
                const lower = event.impact?.toLowerCase() || '';
                if (lower.includes('high')) compactImpact = 'High';
                else if (lower.includes('medium')) compactImpact = 'Medium';
                else if (lower.includes('low')) compactImpact = 'Low';

                // Determine Badge/Border styling
                let borderColor = 'border-slate-500';
                let badgeClass = 'text-slate-400 bg-slate-500/10 border-slate-500/20';

                if (compactImpact === 'High') {
                    borderColor = 'border-rose-500';
                    badgeClass = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
                } else if (compactImpact === 'Medium') {
                    borderColor = 'border-amber-500';
                    badgeClass = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
                } else if (compactImpact === 'Low') {
                    borderColor = 'border-emerald-500';
                    badgeClass = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
                }

                return (
                    <div key={event.id} className={`bg-white dark:bg-slate-900 border-l-4 rounded-r-lg p-3 relative overflow-hidden group transition-colors flex flex-col justify-between shadow-xl min-h-[88px] w-[280px] shrink-0 mb-2 pointer-events-auto ${borderColor}`}>
                        <div className="flex justify-between items-start w-full">
                            <div className="flex items-start gap-2 pr-2">
                                <div className="flex flex-col mt-0.5">
                                    <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug line-clamp-3 pr-2">{event.title || (event as any).name}</div>
                                </div>
                            </div>
                            
                            {/* Top Right Badge (Aligned with Text) */}
                            <div className="flex items-center shrink-0 mt-0.5">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${badgeClass}`}>
                                    {compactImpact}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-auto pt-3">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <Calendar size={12} className="opacity-70" /> {dateStr}
                            </div>
                            <div className="font-mono font-bold text-[15px] leading-none text-slate-700 dark:text-slate-200">
                                {timeStr}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
