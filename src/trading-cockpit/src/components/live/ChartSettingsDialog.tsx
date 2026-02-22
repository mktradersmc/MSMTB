"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCcw, Activity, Monitor, ChevronDown } from 'lucide-react';
import { useChartTheme } from '../../context/ChartThemeContext';
import { ColorPalettePicker } from '../ui/ColorPalettePicker';
import { usePopoverPosition } from '../../hooks/ui/usePopoverPosition';

interface ChartSettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChartSettingsDialog: React.FC<ChartSettingsDialogProps> = ({ isOpen, onClose }) => {
    const { theme, updateTheme, resetTheme } = useChartTheme();

    if (!isOpen) return null;

    const handleUpdate = (section: keyof typeof theme, key: string, value: any) => {
        updateTheme({
            [section]: {
                ...theme[section],
                [key]: value
            }
        });
    };

    const handleGridUpdate = (axis: 'vertLines' | 'horzLines', key: string, value: any) => {
        updateTheme({
            grid: {
                ...theme.grid,
                [axis]: {
                    ...theme.grid[axis],
                    [key]: value
                }
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-[600px] bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="h-12 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 bg-slate-50 dark:bg-slate-800/50">
                    <h2 className="font-semibold text-slate-900 dark:text-slate-200 text-lg">Chart Settings</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                        <X size={18} />
                    </button>
                </div>

                {/* Single Content Area - Compact Layout */}
                <div className="p-6 space-y-6 overflow-y-auto max-h-[600px]">

                    {/* Top Row: Candles & Background */}
                    <div className="grid grid-cols-2 gap-8">

                        {/* Column 1: Candles */}
                        <div className="space-y-3">
                            <SectionTitle>Symbol</SectionTitle>
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-end gap-5 px-1 mb-1">
                                    <span className="text-[10px] uppercase font-bold text-slate-500 w-6 text-center">Buy</span>
                                    <span className="text-[10px] uppercase font-bold text-slate-500 w-6 text-center">Sell</span>
                                </div>
                                <DualColorRow
                                    label="Body" upColor={theme.candles.upColor} downColor={theme.candles.downColor}
                                    onUpChange={(c: string) => handleUpdate('candles', 'upColor', c)}
                                    onDownChange={(c: string) => handleUpdate('candles', 'downColor', c)}
                                />
                                <DualColorRow
                                    label="Borders" upColor={theme.candles.borderUpColor} downColor={theme.candles.borderDownColor}
                                    onUpChange={(c: string) => handleUpdate('candles', 'borderUpColor', c)}
                                    onDownChange={(c: string) => handleUpdate('candles', 'borderDownColor', c)}
                                />
                                <DualColorRow
                                    label="Wicks" upColor={theme.candles.wickUpColor} downColor={theme.candles.wickDownColor}
                                    onUpChange={(c: string) => handleUpdate('candles', 'wickUpColor', c)}
                                    onDownChange={(c: string) => handleUpdate('candles', 'wickDownColor', c)}
                                />
                            </div>
                        </div>

                        {/* Column 2: Background, Crosshair, Text */}
                        <div className="space-y-3">
                            <SectionTitle>Appearance</SectionTitle>
                            <div className="flex flex-col gap-4 pt-6"> {/* Align with rows roughly */}
                                <ColorControl
                                    label="Background"
                                    color={typeof theme.layout.background === 'string' ? theme.layout.background : theme.layout.background.color}
                                    onChange={(c: string) => handleUpdate('layout', 'background', { type: 'solid', color: c })}
                                />
                                <ColorControl
                                    label="Text Color"
                                    color={theme.layout.textColor}
                                    onChange={(c: string) => handleUpdate('layout', 'textColor', c)}
                                />
                                <ColorControl
                                    label="Crosshair"
                                    color={theme.crosshair.color}
                                    onChange={(c: string) => handleUpdate('crosshair', 'color', c)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-200 dark:bg-slate-800 w-full" />

                    {/* Middle Row: Grid */}
                    <div className="space-y-3">
                        <SectionTitle>Grid Lines</SectionTitle>
                        <div className="grid grid-cols-2 gap-8">
                            {/* Vert Grid */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={theme.grid.vertLines.visible}
                                        onChange={(e) => handleGridUpdate('vertLines', 'visible', e.target.checked)}
                                        className="w-3.5 h-3.5 rounded border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800 text-indigo-500 focus:ring-0 cursor-pointer"
                                    />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">Vert. Grid</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ColorControl compact color={theme.grid.vertLines.color} onChange={(c: string) => handleGridUpdate('vertLines', 'color', c)} />
                                    <LineStyleDropdown value={theme.grid.vertLines.style} onChange={(s: number) => handleGridUpdate('vertLines', 'style', s)} />
                                </div>
                            </div>

                            {/* Horz Grid */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={theme.grid.horzLines.visible}
                                        onChange={(e) => handleGridUpdate('horzLines', 'visible', e.target.checked)}
                                        className="w-3.5 h-3.5 rounded border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800 text-indigo-500 focus:ring-0 cursor-pointer"
                                    />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">Horz. Grid</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ColorControl compact color={theme.grid.horzLines.color} onChange={(c: string) => handleGridUpdate('horzLines', 'color', c)} />
                                    <LineStyleDropdown value={theme.grid.horzLines.style} onChange={(s: number) => handleGridUpdate('horzLines', 'style', s)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-200 dark:bg-slate-800 w-full" />

                    {/* Bottom: Scales */}
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <SectionTitle>Scales</SectionTitle>
                            <div className="pt-2">
                                <ColorControl
                                    label="Border Color"
                                    color={theme.timeScale.borderColor}
                                    onChange={(c: string) => {
                                        handleUpdate('timeScale', 'borderColor', c);
                                        handleUpdate('priceScale', 'borderColor', c);
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="h-14 border-t border-slate-200 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
                    <button
                        onClick={() => { if (confirm('Reset all chart settings?')) resetTheme() }}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-xs font-medium"
                    >
                        <RotateCcw size={14} /> Reset Defaults
                    </button>

                    <button
                        onClick={onClose}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-1.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95 text-sm"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- SUB-COMPONENTS ---

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{children}</h3>
);

// New Component: portal-based popup wrapper
const PortalPopup = ({ children, onClose, triggerRef, align = 'left' }: any) => {
    const { top, left, contentRef } = usePopoverPosition({
        triggerRef,
        isOpen: true,
        gap: 6,
        contentHeight: 380 // Estimate, but dynamic will take over
    });

    if (typeof document === 'undefined') return null;

    // Adjust for alignment if 'right' (requires width knowledge or CSS transforms)
    // For now, left align is safer default.
    return createPortal(
        <>
            <div className="fixed inset-0 z-[100]" onClick={onClose} />
            <div
                ref={contentRef}
                className="fixed z-[101]"
                style={{ top, left }}
            >
                {children}
            </div>
        </>,
        document.body
    );
};

const ColorControl = ({ label, color, onChange, compact }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    return (
        <div className={`relative flex items-center justify-between group ${compact ? '' : 'w-full gap-4'}`}>
            {!compact && <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{label}</span>}

            <button
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                className="w-6 h-6 rounded border border-slate-300 dark:border-slate-600 p-0.5 hover:border-slate-400 dark:hover:border-slate-300 transition-colors relative overflow-hidden shrink-0 shadow-sm"
                title={label || color}
            >
                <div className="absolute inset-0 z-0 opacity-20" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M3 0h3v3H3zM0 3h3v3H0z'/%3E%3C/g%3E%3C/svg%3E")`
                }} />
                <div className="w-full h-full rounded-[1px] relative z-10" style={{ backgroundColor: color }}></div>
            </button>

            {isOpen && (
                <PortalPopup onClose={() => setIsOpen(false)} triggerRef={triggerRef}>
                    <ColorPalettePicker
                        color={color}
                        onChange={(c: string) => { onChange(c); setIsOpen(false); }}
                    />
                </PortalPopup>
            )}
        </div>
    );
}

const DualColorRow = ({ label, upColor, downColor, onUpChange, onDownChange }: any) => {
    return (
        <div className="flex items-center justify-between py-1 px-1 hover:bg-slate-100 dark:hover:bg-slate-800/30 rounded">
            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{label}</span>
            <div className="flex gap-2">
                <ColorControl compact color={upColor} onChange={onUpChange} />
                <ColorControl compact color={downColor} onChange={onDownChange} />
            </div>
        </div>
    )
}

// Compact Line Style Dropdown
const LineStyleDropdown = ({ value, onChange }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const styles = [
        { val: 0, label: 'Solid', borderClass: 'border-b-2' },
        { val: 1, label: 'Dotted', borderClass: 'border-b-2 border-dotted' },
        { val: 2, label: 'Dashed', borderClass: 'border-b-2 border-dashed' },
        { val: 3, label: 'L.Dash', borderClass: 'border-b-4 border-dashed' }, // Approximation
    ];

    const current = styles.find(s => s.val === value) || styles[0];

    return (
        <div className="relative">
            <button
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 hover:border-slate-400 transition-colors h-6 w-20 justify-between"
            >
                {/* Visual Preview */}
                <div className={`w-8 h-px ${current.borderClass} translate-y-[1px] border-slate-700 dark:border-slate-300`}></div>
                <ChevronDown size={12} className="text-slate-500 dark:text-slate-400" />
            </button>

            {isOpen && (
                <PortalPopup onClose={() => setIsOpen(false)} triggerRef={triggerRef}>
                    <div className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded shadow-xl flex flex-col p-1 gap-0.5 w-32 animate-in zoom-in-95 duration-100">
                        {styles.map(s => (
                            <button
                                key={s.val}
                                onClick={() => { onChange(s.val); setIsOpen(false); }}
                                className={`flex items-center gap-3 px-3 py-2 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors
                                    ${value === s.val ? 'text-indigo-600 dark:text-indigo-400 bg-slate-100 dark:bg-slate-700/50' : 'text-slate-700 dark:text-slate-300'}
                                `}
                            >
                                <div className={`w-8 h-px ${s.borderClass} translate-y-[1px] border-slate-700 dark:border-slate-300`}></div>
                                <span>{s.label}</span>
                            </button>
                        ))}
                    </div>
                </PortalPopup>
            )}
        </div>
    );
};
