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
                        value={val !== undefined && val !== null ? val : ''}
                        onChange={(e) => handleChange(item.id, item.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                        className="bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-slate-900 dark:text-gray-200 focus:outline-none focus:border-blue-500 w-full"
                    />
                );
        }
    };

    const renderItem = (item: SettingItem) => {
        return (
            <div key={item.id} className="flex items-center justify-between py-2 hover:bg-slate-50 dark:hover:bg-gray-800/50 px-2 rounded-sm transition-colors">
                <div className="flex flex-col">
                    <span className="text-sm text-slate-700 dark:text-gray-300">{item.title}</span>
                    {item.tooltip && <span className="text-[10px] text-slate-400 dark:text-gray-500">{item.tooltip}</span>}
                </div>
                <div className="ml-4 w-1/2 flex justify-end">
                    {renderInput(item)}
                </div>
            </div>
        );
    };

    const content = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 dark:bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-[#1E222D] border border-slate-300 dark:border-[#2A2E39] rounded-lg shadow-2xl w-[400px] flex flex-col max-h-[90vh] p-[1px]" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-4 py-3 shrink-0 border-b border-slate-300 dark:border-[#2A2E39] flex justify-between items-center bg-black rounded-t-[7px] z-10">
                    <h3 className="text-sm font-bold text-slate-200">{definition.name} Settings</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
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
                <div className="p-4 shrink-0 bg-slate-50 dark:bg-[#161a25] flex justify-end gap-2 sticky bottom-0 rounded-b-[7px]">
                    <button onClick={onClose} className="px-3 py-1.5 text-sm font-bold text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 rounded transition-colors">Cancel</button>
                    <button onClick={() => onSave(settings)} className="px-4 py-1.5 text-sm font-bold bg-slate-900 text-white rounded-lg hover:bg-black transition-colors shadow-sm dark:bg-black dark:border dark:border-slate-700 dark:hover:bg-slate-900">Save Changes</button>
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
        if (!val) return { hex: '#000000', opacity: 100, isRgba: false };
        const rgbaMatch = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (rgbaMatch) {
            const r = parseInt(rgbaMatch[1], 10).toString(16).padStart(2, '0');
            const g = parseInt(rgbaMatch[2], 10).toString(16).padStart(2, '0');
            const b = parseInt(rgbaMatch[3], 10).toString(16).padStart(2, '0');
            const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
            return {
                hex: `#${r}${g}${b}`,
                opacity: Math.round(a * 100),
                isRgba: true
            };
        }
        const clean = val.replace('#', '');
        if (clean.length === 8) {
            return {
                hex: '#' + clean.substring(0, 6),
                opacity: Math.round((parseInt(clean.substring(6, 8), 16) / 255) * 100),
                isRgba: false
            };
        }
        return { hex: '#' + clean.substring(0, 6), opacity: 100, isRgba: false };
    };

    const formatColor = (hexVal: string, opVal: number, isRgba: boolean) => {
        if (isRgba) {
            const r = parseInt(hexVal.substring(1, 3), 16);
            const g = parseInt(hexVal.substring(3, 5), 16);
            const b = parseInt(hexVal.substring(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${+(opVal / 100).toFixed(2)})`;
        }
        const alphaHex = Math.round((opVal / 100) * 255).toString(16).padStart(2, '0');
        return (hexVal.substring(0, 7) + alphaHex).toUpperCase();
    };

    const { hex, opacity, isRgba } = parseColor(value);

    // Handler when Picker changes only Color
    const handleColorChange = (newHex: string) => {
        onChange(formatColor(newHex, opacity, isRgba));
    };

    // Handler when Picker changes only Opacity
    const handleOpacityChange = (newOpacity: number) => {
        onChange(formatColor(hex, newOpacity, isRgba));
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
