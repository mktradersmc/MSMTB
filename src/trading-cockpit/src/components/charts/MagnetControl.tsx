"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MagnetService, MagnetMode } from './widgets/MagnetService';
import { ChevronDown, ChevronRight } from 'lucide-react';

/**
 * Magnet icon SVG component.
 */
/**
 * Magnet icon SVG component.
 * "Frame" style: Outlined U-shape with pole separators.
 */
/**
 * Magnet icon SVG component.
 * "Frame" style: Outlined U-shape with pole separators.
 * Wider design: Outer 4-20, Inner 9-15.
 */
const MagnetIcon = ({ active }: { active: boolean }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        {/* Main Body Outline (Wider) */}
        <path d="M4 21V10a8 8 0 0 1 16 0v11h-5V10a3 3 0 0 0-6 0v11H4z" />
        {/* Pole Separators */}
        <path d="M4 16h5" />
        <path d="M15 16h5" />
    </svg>
);

/**
 * Strong Magnet icon with 'sparks'
 */
const StrongMagnetIcon = ({ active }: { active: boolean }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        {/* Main Body (Wider) */}
        <path d="M4 21V10a8 8 0 0 1 16 0v11h-5V10a3 3 0 0 0-6 0v11H4z" />
        {/* Pole Separators */}
        <path d="M4 16h5" />
        <path d="M15 16h5" />
        {/* Sparks/Lightning */}
        <path d="M8 3l-3 4" />
        <path d="M16 3l3 4" />
        <path d="M12 2v4" />
    </svg>
);

export const MagnetControl: React.FC<{ side?: 'right' | 'top' }> = ({ side = 'top' }) => {
    const [mode, setMode] = useState<MagnetMode>('OFF');
    const [prevActiveMode, setPrevActiveMode] = useState<MagnetMode>('WEAK');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Sync with MagnetService
    useEffect(() => {
        setMode(MagnetService.getMode());
        const unsubscribe = MagnetService.subscribe((newMode) => {
            setMode(newMode);
            if (newMode !== 'OFF') {
                setPrevActiveMode(newMode);
            }
        });
        return unsubscribe;
    }, []);

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = () => {
        if (mode === 'OFF') {
            MagnetService.setMode(prevActiveMode);
        } else {
            MagnetService.setMode('OFF');
        }
    };

    const handleSelectMode = (newMode: 'WEAK' | 'STRONG') => {
        MagnetService.setMode(newMode);
        setIsMenuOpen(false);
    };

    const isActive = mode !== 'OFF';

    const menuClasses = side === 'right'
        ? "absolute left-full top-0 ml-[18px] w-56 bg-white dark:bg-[#1e222d] border border-slate-200 dark:border-slate-800 rounded shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-left-1"
        : "absolute bottom-full right-0 mb-2 w-56 bg-white dark:bg-[#1e222d] border border-slate-200 dark:border-slate-800 rounded shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-1";

    return (
        <div className="relative flex items-center justify-center group" ref={menuRef}>
            {/* Hover container for triggering arrow visibility */}
            <div className="flex items-center gap-0.5">

                {/* Main Toggle Button */}
                <button
                    onClick={handleToggle}
                    className={`
                        p-2 rounded transition-all flex items-center justify-center
                        ${isActive
                            ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/30'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}
                    `}
                    title={isActive ? `Magnet ON (${mode})` : 'Magnet OFF'}
                >
                    {mode === 'STRONG' ? <StrongMagnetIcon active={isActive} /> : <MagnetIcon active={isActive} />}
                </button>

                {/* Arrow / Dropdown Button - Hidden by default, visible on group hover */}
                {/* Dedicated Hover Button for the Dropdown Arrow */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(!isMenuOpen);
                    }}
                    className={`
                        absolute left-full ml-0.5 w-4 h-full flex items-center justify-center rounded-[3px]
                        opacity-0 group-hover:opacity-100 transition-all
                        text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer
                    `}
                    title="Magnet-Modus"
                >
                    <ChevronRight size={14} strokeWidth={3} className="mr-0.5" />
                </button>
            </div>

            {/* Dropdown Menu */}
            {isMenuOpen && (
                <div className={menuClasses}>
                    <div className="py-1">
                        <button
                            onClick={() => handleSelectMode('WEAK')}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${mode === 'WEAK' ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="shrink-0 scale-[0.85] origin-left"><MagnetIcon active={true} /></span>
                                <span>Schwacher Magnet</span>
                            </div>
                        </button>
                        <button
                            onClick={() => handleSelectMode('STRONG')}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${mode === 'STRONG' ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="shrink-0 scale-[0.85] origin-left"><StrongMagnetIcon active={true} /></span>
                                <span>Starker Magnet</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
