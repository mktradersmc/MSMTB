
import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore, LayoutType } from '../../stores/useWorkspaceStore';
import { Square, Columns, Rows, Grid2x2, LayoutTemplate, ChevronDown } from 'lucide-react';

export const LayoutSwitcher: React.FC = () => {
    const { activeWorkspaceId, updateWorkspaceLayout, workspaces } = useWorkspaceStore();
    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!activeWorkspace) return null;

    const currentLayout = activeWorkspace.layoutType;

    const setLayout = (layout: LayoutType) => {
        updateWorkspaceLayout(activeWorkspaceId, layout);
        setIsOpen(false);
    };

    const options: { id: LayoutType; icon: React.ReactNode; label: string }[] = [
        { id: 'single', icon: <Square size={18} />, label: 'Single Config' },
        { id: 'split-vertical', icon: <Columns size={18} />, label: 'Split Vertical' },
        { id: 'split-horizontal', icon: <Rows size={18} />, label: 'Split Horizontal' },
        { id: 'grid-2x2', icon: <Grid2x2 size={18} />, label: 'Grid 2x2' },
        { id: 'grid-1-2', icon: <LayoutTemplate size={18} />, label: 'Grid 1+2' },
    ];

    const activeOption = options.find(o => o.id === currentLayout) || options[0];

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 h-8 px-2 bg-transparent rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                title="Change Layout"
            >
                {activeOption.icon}
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xl z-[100] overflow-hidden flex flex-col py-1">
                    {options.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => setLayout(opt.id)}
                            className={`
                                flex items-center gap-3 px-3 py-2 w-full text-left transition-colors
                                ${currentLayout === opt.id
                                    ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}
                            `}
                        >
                            <span className={currentLayout === opt.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}>
                                {opt.icon}
                            </span>
                            <span className="text-xs font-medium">{opt.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
