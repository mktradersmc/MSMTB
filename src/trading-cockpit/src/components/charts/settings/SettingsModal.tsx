import React, { useState, useEffect } from 'react';
import { SettingField } from '../widgets/InteractiveChartObject';
import { X } from 'lucide-react';

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#1E222D] border border-slate-300 dark:border-[#2A2E39] rounded-lg shadow-xl w-full max-w-sm overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-200 dark:border-[#2A2E39] flex justify-between items-center bg-slate-50 dark:bg-[#2A2E39]/30">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-200">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4">
                    {schema.map((field) => (
                        <div key={field.id} className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                {field.label}
                            </label>

                            {/* Render Input based on Type */}
                            {field.type === 'color' && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={formData[field.id] || '#000000'}
                                        onChange={(e) => handleChange(field.id, e.target.value)}
                                        className="h-8 w-12 rounded cursor-pointer bg-transparent border-none p-0"
                                    />
                                    <span className="text-sm font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#2A2E39] px-2 py-1 rounded border border-slate-200 dark:border-transparent">
                                        {formData[field.id]}
                                    </span>
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
                                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-[#131722] text-indigo-500 focus:ring-indigo-500 focus:ring-offset-white dark:focus:ring-offset-slate-900"
                                    />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">Enabled</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-slate-50 dark:bg-[#2A2E39]/30 border-t border-slate-200 dark:border-[#2A2E39] flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow-sm transition-colors"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
