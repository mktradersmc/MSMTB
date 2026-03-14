import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SettingField } from '../widgets/InteractiveChartObject';
import { X } from 'lucide-react';
import { ColorPalettePicker } from '../../ui/ColorPalettePicker';
import { usePopoverPosition } from '../../../hooks/ui/usePopoverPosition';

export interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: any) => void;
    schema: SettingField[];
    title?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, schema, title = 'Settings' }) => {
    const [formData, setFormData] = useState<Record<string, any>>({});

    // Initialize form data from schema values when opened
    useEffect(() => {
        if (isOpen) {
            const initialData: Record<string, any> = {};
            schema.forEach(field => {
                initialData[field.id] = field.value;
            });
            setFormData(initialData);
        }
    }, [isOpen, schema]);

    if (!isOpen) return null;

    const handleChange = (id: string, value: any) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#1E222D] border border-slate-300 dark:border-[#2A2E39] rounded-lg shadow-xl w-full max-w-sm flex flex-col p-[1px]"
                style={{ maxHeight: 'min(800px, 90vh)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-4 py-3 shrink-0 flex justify-between items-center bg-slate-900 dark:bg-[#090b0f] rounded-t-[7px] z-10 p-[1px] mb-[1px]">
                    <h3 className="font-semibold text-white">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
                    {schema.map((field) => (
                        <div key={field.id} className="flex flex-col gap-1.5">
                            {field.type !== 'boolean' && (
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    {field.label}
                                </label>
                            )}

                            {/* Render Input based on Type */}
                            {field.type === 'color' && (
                                <div className="flex items-center gap-3">
                                    <ColorInput
                                        value={formData[field.id] || '#000000'}
                                        onChange={(val) => handleChange(field.id, val)}
                                    />
                                </div>
                            )}

                            {field.type === 'number' && (
                                <input
                                    type="number"
                                    value={formData[field.id] || 0}
                                    onChange={(e) => handleChange(field.id, parseFloat(e.target.value))}
                                    className="bg-white dark:bg-[#131722] border border-slate-300 dark:border-[#2A2E39] rounded px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors w-full"
                                />
                            )}

                            {field.type === 'text' && (
                                <input
                                    type="text"
                                    value={formData[field.id] || ''}
                                    onChange={(e) => handleChange(field.id, e.target.value)}
                                    className="bg-white dark:bg-[#131722] border border-slate-300 dark:border-[#2A2E39] rounded px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors w-full"
                                />
                            )}

                            {field.type === 'select' && field.options && (
                                <select
                                    value={formData[field.id]}
                                    onChange={(e) => handleChange(field.id, e.target.value)}
                                    className="bg-white dark:bg-[#131722] border border-slate-300 dark:border-[#2A2E39] rounded px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors w-full"
                                >
                                    {field.options.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            )}

                            {field.type === 'boolean' && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={!!formData[field.id]}
                                        onChange={(e) => handleChange(field.id, e.target.checked)}
                                        className="w-4 h-4 cursor-pointer rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-[#131722] text-indigo-500 focus:ring-indigo-500 focus:ring-offset-white dark:focus:ring-offset-slate-900"
                                    />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">{field.label}</span>
                                </div>
                            )}

                            {field.type === 'fib_levels' && (
                                <div className="space-y-3 mt-2 pb-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                        {field.label}
                                    </label>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                        {(formData[field.id] || []).map((levelObj: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={levelObj.visible}
                                                    onChange={(e) => {
                                                        const newArr = [...formData[field.id]];
                                                        newArr[idx] = { ...newArr[idx], visible: e.target.checked };
                                                        handleChange(field.id, newArr);
                                                    }}
                                                    className="w-4 h-4 cursor-pointer rounded border-slate-300 dark:border-slate-500 bg-white dark:bg-[#131722] text-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shrink-0"
                                                />
                                                <input
                                                    type="number"
                                                    value={levelObj.level}
                                                    step="0.001"
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val)) {
                                                            const newArr = [...formData[field.id]];
                                                            newArr[idx] = { ...newArr[idx], level: val };
                                                            handleChange(field.id, newArr);
                                                        }
                                                    }}
                                                    className="bg-white dark:bg-[#131722] border border-slate-300 dark:border-[#2A2E39] rounded px-3 py-1.5 text-sm font-medium text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors w-full"
                                                />
                                                <div className="shrink-0">
                                                    <ColorInput
                                                        value={levelObj.color || '#000000'}
                                                        onChange={(val) => {
                                                            const newArr = [...formData[field.id]];
                                                            newArr[idx] = { ...newArr[idx], color: val };
                                                            handleChange(field.id, newArr);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 shrink-0 bg-slate-50 dark:bg-[#1C202A] flex justify-end gap-2 rounded-b-[7px] relative z-10">
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-1.5 text-sm font-medium bg-slate-900 hover:bg-black text-white rounded shadow-sm transition-colors dark:bg-black dark:border dark:border-slate-700 dark:hover:bg-slate-900"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(modalContent, document.body);
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
