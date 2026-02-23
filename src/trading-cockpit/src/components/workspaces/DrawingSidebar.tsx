import React, { useState, useEffect, useRef } from 'react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useChartRegistryStore } from '../../stores/useChartRegistryStore';
import { MagnetControl } from '../charts/MagnetControl';
import {
    MousePointer2,
    ChevronRight
} from 'lucide-react';

/**
 * TV Style Icons (Projection Style)
 */
const LongPosIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="pointer-events-none">
        <path d="M7 5h13" strokeLinecap="round" />
        <path d="M7 12h13" strokeLinecap="round" />
        <path d="M7 19h13" strokeLinecap="round" />
        <circle cx="4" cy="5" r="2" />
        <circle cx="4" cy="12" r="2" />
        <circle cx="4" cy="19" r="2" />
        <path d="M4 19L20 5" strokeDasharray="3 3" />
    </svg>
);

const ShortPosIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="pointer-events-none">
        <path d="M7 5h13" strokeLinecap="round" />
        <path d="M7 12h13" strokeLinecap="round" />
        <path d="M7 19h13" strokeLinecap="round" />
        <circle cx="4" cy="5" r="2" />
        <circle cx="4" cy="12" r="2" />
        <circle cx="4" cy="19" r="2" />
        <path d="M4 5L20 19" strokeDasharray="3 3" />
    </svg>
);

const TradeBuilderIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="pointer-events-none">
        <path d="M4 12h16" strokeLinecap="round" />
        <path d="M4 6h16" strokeDasharray="3 3" strokeLinecap="round" />
        <path d="M4 18h16" strokeDasharray="3 3" strokeLinecap="round" />
        <circle cx="20" cy="12" r="2" />
        <circle cx="20" cy="6" r="2" />
        <circle cx="20" cy="18" r="2" />
    </svg>
);

const FibonacciIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="pointer-events-none">
        <path d="M4 6h16" strokeLinecap="round" />
        <path d="M4 12h16" strokeLinecap="round" />
        <path d="M4 18h16" strokeLinecap="round" />
        <path d="M6 18L18 6" strokeLinecap="round" />
        <circle cx="6" cy="18" r="2" fill="currentColor" />
        <circle cx="18" cy="6" r="2" fill="currentColor" />
    </svg>
);

const HorizontalLineIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="pointer-events-none">
        <path d="M3 12h7" strokeLinecap="round" />
        <circle cx="12" cy="12" r="2" />
        <path d="M14 12h7" strokeLinecap="round" />
    </svg>
);

const HorizontalRayIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="pointer-events-none">
        <circle cx="5" cy="12" r="2" />
        <path d="M7 12h14" strokeLinecap="round" />
    </svg>
);

const VerticalLineIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="pointer-events-none">
        <path d="M12 3v7" strokeLinecap="round" />
        <circle cx="12" cy="12" r="2" />
        <path d="M12 14v7" strokeLinecap="round" />
    </svg>
);

const LineToolsControl: React.FC<{ onSelectTool: (tool: string) => void }> = ({ onSelectTool }) => {
    const [selectedTool, setSelectedTool] = useState<'HorizontalLine' | 'HorizontalRay' | 'VerticalLine'>('HorizontalLine');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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

    const handleMainClick = () => {
        onSelectTool(selectedTool);
    };

    const handleSelectOption = (tool: 'HorizontalLine' | 'HorizontalRay' | 'VerticalLine') => {
        setSelectedTool(tool);
        onSelectTool(tool);
        setIsMenuOpen(false);
    };

    const isActiveOption = (tool: string) => tool === selectedTool;

    const btnClass = "p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-slate-500 dark:text-slate-400";

    const getIconForTool = (tool: string) => {
        if (tool === 'HorizontalLine') return <HorizontalLineIcon />;
        if (tool === 'HorizontalRay') return <HorizontalRayIcon />;
        if (tool === 'VerticalLine') return <VerticalLineIcon />;
        return <HorizontalLineIcon />;
    };

    const { activeDrawingTool } = useWorkspaceStore();
    const isActive = activeDrawingTool === selectedTool;

    return (
        <div className="relative flex flex-col items-center group w-full" ref={menuRef}>
            <div className="relative flex items-center justify-center w-full">
                {/* Main Action Button */}
                <button
                    onClick={handleMainClick}
                    className={isActive ? `${btnClass} bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400` : btnClass}
                    title="Linien-Werkzeuge"
                >
                    {getIconForTool(selectedTool)}
                </button>

                {/* Dedicated Hover Button for the Dropdown Arrow */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(!isMenuOpen);
                    }}
                    className={`
                        absolute left-full ml-0.5 w-4 h-full flex items-center justify-center rounded-r
                        opacity-0 group-hover:opacity-100 transition-all
                        text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer
                    `}
                    title="Zeichen-Werkzeuge"
                >
                    <ChevronRight size={14} strokeWidth={3} className="mr-0.5" />
                </button>
            </div>

            {/* Popup Menu */}
            {isMenuOpen && (
                <div className="absolute left-full top-0 ml-[18px] w-[280px] bg-white dark:bg-[#1e222d] border border-slate-200 dark:border-slate-800 rounded shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-left-1">
                    <div className="py-1">
                        {/* Horizontal Line */}
                        <button
                            onClick={() => handleSelectOption('HorizontalLine')}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${isActiveOption('HorizontalLine') ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="shrink-0"><HorizontalLineIcon /></span>
                                <span>Horizontale Linie</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 dark:text-slate-500">Alt + H</span>
                            </div>
                        </button>

                        {/* Horizontal Ray */}
                        <button
                            onClick={() => handleSelectOption('HorizontalRay')}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${isActiveOption('HorizontalRay') ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="shrink-0"><HorizontalRayIcon /></span>
                                <span>Horizontaler Strahl</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 dark:text-slate-500">Alt + J</span>
                            </div>
                        </button>

                        {/* Vertical Line */}
                        <button
                            onClick={() => handleSelectOption('VerticalLine')}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${isActiveOption('VerticalLine') ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="shrink-0"><VerticalLineIcon /></span>
                                <span>Vertikale Linie</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 dark:text-slate-500">Alt + V</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const PredictionToolsControl: React.FC<{ onSelectTool: (tool: string) => void }> = ({ onSelectTool }) => {
    const [selectedTool, setSelectedTool] = useState<'Long' | 'Short' | 'Fibonacci'>('Long');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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

    const handleMainClick = () => {
        onSelectTool(selectedTool);
    };

    const handleSelectOption = (tool: 'Long' | 'Short' | 'Fibonacci') => {
        setSelectedTool(tool);
        onSelectTool(tool);
        setIsMenuOpen(false);
    };

    const isActiveOption = (tool: string) => tool === selectedTool;

    const btnClass = "p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-slate-500 dark:text-slate-400";

    const getIconForTool = (tool: string) => {
        if (tool === 'Long') return <LongPosIcon />;
        if (tool === 'Short') return <ShortPosIcon />;
        if (tool === 'Fibonacci') return <FibonacciIcon />;
        return <LongPosIcon />;
    };

    const { activeDrawingTool } = useWorkspaceStore();
    // Map sidebar tool names to the activeDrawingTool types
    const mappedSelectedTool = selectedTool === 'Long' ? 'Riskrewardlong' :
        selectedTool === 'Short' ? 'Riskrewardshort' :
            selectedTool === 'Fibonacci' ? 'Fibonacci' : '';
    const isActive = activeDrawingTool === mappedSelectedTool;

    return (
        <div className="relative flex flex-col items-center group w-full" ref={menuRef}>
            <div className="relative flex items-center justify-center w-full">
                {/* Main Action Button */}
                <button
                    onClick={handleMainClick}
                    className={isActive ? `${btnClass} bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400` : btnClass}
                    title="Prognose-Werkzeuge"
                >
                    {getIconForTool(selectedTool)}
                </button>

                {/* Dedicated Hover Button for the Dropdown Arrow */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(!isMenuOpen);
                    }}
                    className={`
                        absolute left-full ml-0.5 w-4 h-full flex items-center justify-center rounded-r
                        opacity-0 group-hover:opacity-100 transition-all
                        text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer
                    `}
                    title="Prognose-Werkzeuge"
                >
                    <ChevronRight size={14} strokeWidth={3} className="mr-0.5" />
                </button>
            </div>

            {/* Popup Menu */}
            {isMenuOpen && (
                <div className="absolute left-full top-0 ml-[18px] w-[280px] bg-white dark:bg-[#1e222d] border border-slate-200 dark:border-slate-800 rounded shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-left-1">
                    <div className="py-1">
                        {/* Long Position */}
                        <button
                            onClick={() => handleSelectOption('Long')}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${isActiveOption('Long') ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="shrink-0"><LongPosIcon /></span>
                                <span>Long Position</span>
                            </div>
                        </button>

                        {/* Short Position */}
                        <button
                            onClick={() => handleSelectOption('Short')}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${isActiveOption('Short') ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="shrink-0"><ShortPosIcon /></span>
                                <span>Short Position</span>
                            </div>
                        </button>

                        {/* Fibonacci Retracement */}
                        <button
                            onClick={() => handleSelectOption('Fibonacci')}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${isActiveOption('Fibonacci') ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="shrink-0"><FibonacciIcon /></span>
                                <span>Fibonacci Retracement</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export const DrawingSidebar: React.FC = () => {
    const { activeDrawingTool, setActiveDrawingTool } = useWorkspaceStore();

    const handleToolClick = (toolName: string) => {
        if (toolName === 'Cursor') {
            setActiveDrawingTool(null);
            return;
        }

        // Mapping
        let shapeType = '';
        if (toolName === 'HorizontalLine') shapeType = 'HorizontalLine';
        if (toolName === 'HorizontalRay') shapeType = 'HorizontalRay';
        if (toolName === 'VerticalLine') shapeType = 'VerticalLine';
        if (toolName === 'Long') shapeType = 'Riskrewardlong';
        if (toolName === 'Short') shapeType = 'Riskrewardshort';
        if (toolName === 'TradeBuilder') shapeType = 'TradeBuilder';
        if (toolName === 'Fibonacci') shapeType = 'Fibonacci';

        if (shapeType) {
            setActiveDrawingTool(shapeType);
        }
    };

    const btnClass = "p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-slate-500 dark:text-slate-400";
    const activeBtnClass = `${btnClass} bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400`;

    return (
        <div className="flex flex-col items-center gap-4 py-4 w-12 border-r border-slate-200 dark:border-slate-700 relative z-[100] pointer-events-auto">
            {/* 1. Crosshair/Cursor */}
            <button
                onClick={() => handleToolClick('Cursor')}
                className={activeDrawingTool === null ? activeBtnClass : btnClass}
                title="Crosshair"
            >
                <MousePointer2 size={20} strokeWidth={1.5} className="pointer-events-none" />
            </button>
            {/* 2. Line Tools (Grouped) */}
            <LineToolsControl onSelectTool={handleToolClick} />
            {/* 3. Prediction Tools (Grouped) */}
            <PredictionToolsControl onSelectTool={handleToolClick} />
            {/* 4. Magnet */}
            <div className="w-full">
                <MagnetControl side="right" />
            </div>
        </div>
    );
};
