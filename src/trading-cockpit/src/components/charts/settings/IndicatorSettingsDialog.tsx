import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ColorPalettePicker } from '../../ui/ColorPalettePicker';
import { usePopoverPosition } from '../../../hooks/ui/usePopoverPosition';

export interface SettingItem {
    id: string;
    type: 'bool' | 'string' | 'number' | 'color' | 'session' | 'select' | 'time_range';
    title: string;
    def?: any;
    options?: string[]; // For select
    group?: string;
    tooltip?: string;
}

interface IndicatorSettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: any) => void;
    definition: {
        name: string;
        settingsSchema: SettingItem[];
    };
    currentSettings: any;
}

export const IndicatorSettingsDialog: React.FC<IndicatorSettingsDialogProps> = ({
    isOpen, onClose, onSave, definition, currentSettings
}) => {
    const [settings, setSettings] = useState(currentSettings);

    // Track previous open state to only reset on OPEN event, not on prop updates while open
    const prevOpenRef = React.useRef(isOpen);

    useEffect(() => {
        // Did we just open?
        if (isOpen && !prevOpenRef.current) {
            setSettings({
                ...definition.settingsSchema.reduce((acc: any, item: any) => {
                    acc[item.id] = item.def;
                    return acc;
                }, {}), ...currentSettings
            });
        }
        prevOpenRef.current = isOpen;
    }, [isOpen, currentSettings, definition]);

    const handleChange = (id: string, value: any) => {
        setSettings((prev: any) => ({ ...prev, [id]: value }));
    };

    if (!isOpen) return null;

    // Group items
    const groups: { [key: string]: SettingItem[] } = {};
    const ungrouped: SettingItem[] = [];

    definition.settingsSchema.forEach(item => {
        if (item.group) {
            if (!groups[item.group]) groups[item.group] = [];
            groups[item.group].push(item);
        } else {
            ungrouped.push(item);
        }
    });

    const renderInput = (item: SettingItem) => {
        const val = settings[item.id];

        switch (item.type) {
            case 'bool':
                return (
                    <input
                        type="checkbox"
                        checked={!!val}
                        onChange={(e) => handleChange(item.id, e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                    />
                );
            case 'color':
                return (
                    <ColorInput
                        value={val}
                        onChange={(v) => handleChange(item.id, v)}
                    />
                );
            case 'select':
                return (
                    <select
                        value={val || ''}
                        onChange={(e) => handleChange(item.id, e.target.value)}
                        className="bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-slate-900 dark:text-gray-200 focus:outline-none focus:border-blue-500"
                    >
                        {item.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                );
            case 'time_range':
                return (
                    <TimeRangePicker
                        value={val || '0930-1600'}
                        onChange={(newVal) => handleChange(item.id, newVal)}
                    />
                );
            default:
                return (
                    <input
                        type={item.type === 'number' ? 'number' : 'text'}
                        value={val || ''}
                        onChange={(e) => handleChange(item.id, item.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                        className="bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-slate-900 dark:text-gray-200 focus:outline-none focus:border-blue-500 w-full"
                    />
                );
        }
    };

    const renderItem = (item: SettingItem) => (
        <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-gray-800 last:border-0 hover:bg-slate-50 dark:hover:bg-gray-800/50 px-2 rounded-sm transition-colors">
            <div className="flex flex-col">
                <span className="text-sm text-slate-700 dark:text-gray-300">{item.title}</span>
                {item.tooltip && <span className="text-[10px] text-slate-400 dark:text-gray-500">{item.tooltip}</span>}
            </div>
            <div className="ml-4 w-1/2 flex justify-end">
                {renderInput(item)}
            </div>
        </div>
    );

    const content = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 dark:bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-[#1e222d] border border-slate-300 dark:border-gray-700 rounded-lg shadow-xl w-[400px] max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center bg-slate-50 dark:bg-[#2a2e39] rounded-t-lg">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-200">{definition.name} Settings</h3>
                    <button onClick={onClose} className="text-slate-400 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {/* Groups */}
                    {Object.keys(groups).map(groupName => (
                        <div key={groupName} className="mb-6">
                            <h4 className="text-xs font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200 dark:border-gray-700/50">{groupName}</h4>
                            <div className="space-y-0.5">
                                {groups[groupName].map(renderItem)}
                            </div>
                        </div>
                    ))}

                    {/* Ungrouped */}
                    {ungrouped.length > 0 && (
                        <div className="mb-4 space-y-0.5">
                            {ungrouped.map(renderItem)}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-[#2a2e39] rounded-b-lg flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-1.5 text-sm text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-700 rounded transition-colors">Cancel</button>
                    <button onClick={() => onSave(settings)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors font-medium shadow-sm">Save Changes</button>
                </div>
            </div>
        </div>
    );

    // Render via Portal to body to escape Z-Index stacking contexts of ChartPane/Splitter
    // Ensure document is defined (client-side only check is handled by next.js normally, but safe guard)
    if (typeof document === 'undefined') return null;

    return createPortal(content, document.body);
};


// --- Time Picker Components (Moved Outside and Improved) ---

const TimeRangePicker: React.FC<{ value: string, onChange: (val: string) => void }> = ({ value, onChange }) => {
    // Parse "HHmm-HHmm" -> ["HH:mm", "HH:mm"]
    const parse = (v: string) => {
        if (!v || !v.includes('-')) return { start: '09:30', end: '16:00' };
        const [s, e] = v.split('-');
        const fmt = (t: string) => (t.length === 4 ? `${t.substring(0, 2)}:${t.substring(2, 4)}` : t);
        return { start: fmt(s), end: fmt(e) };
    };

    const [times, setTimes] = useState(parse(value));

    // Sync with external value changes ONLY if meaningful difference
    useEffect(() => {
        const current = parse(value);
        setTimes(prev => {
            if (prev.start !== current.start || prev.end !== current.end) {
                return current;
            }
            return prev;
        });
    }, [value]);

    const update = (type: 'start' | 'end', newVal: string) => {
        const newTimes = { ...times, [type]: newVal };
        setTimes(newTimes);

        // Convert "HH:mm" -> "HHmm"
        const clean = (t: string) => t.replace(':', '').padStart(4, '0');
        onChange(`${clean(newTimes.start)}-${clean(newTimes.end)}`);
    };

    return (
        <div className="flex items-center gap-2">
            <TimeInput value={times.start} onChange={(v) => update('start', v)} />
            <span className="text-slate-500 dark:text-gray-500">-</span>
            <TimeInput value={times.end} onChange={(v) => update('end', v)} />
        </div>
    );
};

const TimeInput: React.FC<{ value: string, onChange: (val: string) => void }> = ({ value, onChange }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Split value into HH and MM for local consumption
    // Maintain local state to allow 'incomplete' typing before commit
    const parse = (v: string) => {
        const p = (v || '00:00').split(':');
        return { hh: p[0] || '00', mm: p[1] || '00' };
    };

    const [local, setLocal] = useState(parse(value));

    // Sync local state when external value changes
    useEffect(() => {
        setLocal(parse(value));
    }, [value]);

    const commit = () => {
        let hn = parseInt(local.hh) || 0;
        let mn = parseInt(local.mm) || 0;
        hn = Math.min(23, Math.max(0, hn));
        mn = Math.min(59, Math.max(0, mn));

        const fmt = (n: number) => n.toString().padStart(2, '0');
        const formatted = `${fmt(hn)}:${fmt(mn)}`;

        onChange(formatted);
        // Force local update to formatted version
        setLocal({ hh: fmt(hn), mm: fmt(mn) });
    };

    const handleBlur = () => {
        commit();
    };

    const handleInput = (type: 'hh' | 'mm', val: string) => {
        const num = val.replace(/[^0-9]/g, '');
        if (num.length > 2) return;
        setLocal(prev => ({ ...prev, [type]: num }));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            setShowDropdown(false);
            commit();
            (e.target as HTMLInputElement).blur();
        }
    };

    // Close on click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Generate 15m intervals
    const times = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
            times.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
    }

    return (
        <div className="relative w-20 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded flex items-center px-1" ref={containerRef}>
            <input
                type="text"
                value={local.hh}
                onChange={(e) => handleInput('hh', e.target.value)}
                onBlur={handleBlur}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                maxLength={2}
                className="w-7 bg-transparent text-center text-sm text-slate-900 dark:text-gray-200 focus:outline-none placeholder-slate-400 dark:placeholder-gray-500"
            />
            <span className="text-slate-400 dark:text-gray-400 select-none">:</span>
            <input
                type="text"
                value={local.mm}
                onChange={(e) => handleInput('mm', e.target.value)}
                onBlur={handleBlur}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                maxLength={2}
                className="w-7 bg-transparent text-center text-sm text-slate-900 dark:text-gray-200 focus:outline-none"
            />

            {showDropdown && (
                <div className="absolute top-full left-0 mt-1 w-24 -ml-2 max-h-48 overflow-y-auto bg-white dark:bg-[#1e222d] border border-slate-300 dark:border-gray-600 rounded shadow-xl z-[99999] custom-scrollbar">
                    {times.map(t => (
                        <div
                            key={t}
                            className={`px-2 py-1 text-xs cursor-pointer hover:bg-blue-600 hover:text-white ${t === value ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-gray-300'}`}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onChange(t);
                                setShowDropdown(false);
                            }}
                        >
                            {t}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ColorInput: React.FC<{ value: string, onChange: (val: string) => void }> = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const { top, left, contentRef } = usePopoverPosition({
        triggerRef: buttonRef as React.RefObject<HTMLElement>,
        isOpen: open,
        gap: 5,
        contentHeight: 380 // Estimate for initial render
    });

    // Helpers for Hex8 <-> Hex + Opacity
    const parseColor = (val: string) => {
        const clean = (val || '#000000').replace('#', '');
        if (clean.length === 8) {
            return {
                hex: '#' + clean.substring(0, 6),
                opacity: Math.round((parseInt(clean.substring(6), 16) / 255) * 100)
            };
        }
        return { hex: '#' + clean, opacity: 100 }; // Default 100%
    };

    const toHex8 = (hex: string, opacity: number) => {
        const alpha = Math.round((opacity / 100) * 255);
        const alphaHex = alpha.toString(16).padStart(2, '0');
        return (hex.substring(0, 7) + alphaHex).toUpperCase();
    };

    const { hex, opacity } = parseColor(value);

    // Handler when Picker changes only Color
    const handleColorChange = (newHex: string) => {
        onChange(toHex8(newHex, opacity));
    };

    // Handler when Picker changes only Opacity
    const handleOpacityChange = (newOpacity: number) => {
        onChange(toHex8(hex, newOpacity));
    };

    return (
        <>
            <div className="flex items-center gap-2">
                <button
                    ref={buttonRef}
                    onClick={() => setOpen(!open)}
                    className="w-8 h-8 rounded-md border border-slate-300 dark:border-gray-600 cursor-pointer hover:border-blue-500 transition-colors shadow-sm relative overflow-hidden"
                    title="Change Color"
                >
                    {/* Checkerboard for opacity preview */}
                    <div className="absolute inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwYXRoIGZpbGw9IiM4MDgwODAiIGQ9Ik0wIDBoNHY0SDB6bTQgNGg0djRINFoiIGZpbGwtb3BhY2l0eT0iMC4yIi8+PC9zdmc+')]" />
                    <div className="absolute inset-0 z-10" style={{ backgroundColor: value || '#000000' }} />
                </button>
                {/* Optional Text Display */}
                <span className="text-xs font-mono text-slate-500 dark:text-gray-500">{value}</span>
            </div>

            {open && createPortal(
                <div className="fixed inset-0 z-[100000]" onClick={() => setOpen(false)}>
                    <div
                        ref={contentRef}
                        className="absolute"
                        style={{ top, left }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ColorPalettePicker
                            color={hex}
                            opacity={opacity}
                            onChange={handleColorChange}
                            onOpacityChange={handleOpacityChange}
                        />
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};
