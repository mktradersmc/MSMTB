
import React, { useEffect, useState, useRef } from 'react';
import { LayoutStateManager, SyncOptions } from '../../stores/LayoutStateManager';
import { Link, Link2, ScanLine, Info, ChevronDown } from 'lucide-react';

export const SyncCenter: React.FC = () => {
    const [options, setOptions] = useState<SyncOptions>({ isTimeframeSync: false, isPositionSync: false });
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const manager = LayoutStateManager.getInstance();

    useEffect(() => {
        setOptions(manager.getOptions());
        // Simple polling to keep UI in sync if changed elsewhere
        const interval = setInterval(() => {
            const current = manager.getOptions();
            setOptions(prev => {
                if (prev.isTimeframeSync !== current.isTimeframeSync || prev.isPositionSync !== current.isPositionSync) {
                    return current;
                }
                return prev;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleTimeframe = () => {
        const newVal = !options.isTimeframeSync;
        const newOpts = { ...options, isTimeframeSync: newVal };
        setOptions(newOpts);
        manager.setOptions({ isTimeframeSync: newVal });
    };

    const togglePosition = () => {
        const newVal = !options.isPositionSync;
        const newOpts = { ...options, isPositionSync: newVal };
        setOptions(newOpts);
        manager.setOptions({ isPositionSync: newVal });
    };

    const toggleTotalSync = () => {
        // If anything is off, turn all on. If all on, turn all off.
        const allOn = options.isTimeframeSync && options.isPositionSync;
        const newState = !allOn;
        const newOpts = { isTimeframeSync: newState, isPositionSync: newState };
        setOptions(newOpts);
        manager.setOptions(newOpts);
    };

    const isAnyActive = options.isTimeframeSync || options.isPositionSync;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Main Split Button */}
            <div className={`flex items-center h-8 rounded-md transition-all ${isAnyActive ? 'bg-blue-500/20 text-blue-400' : 'bg-transparent text-slate-400'}`}>

                {/* Main Toggle Action */}
                <button
                    onClick={toggleTotalSync}
                    className={`flex items-center justify-center pl-2 pr-1 h-full transition-colors rounded-l-md ${isAnyActive ? 'hover:bg-blue-500/30' : 'hover:bg-slate-800'}`}
                    title={isAnyActive ? "Disable All Sync" : "Enable All Sync"}
                >
                    {isAnyActive ? <Link size={14} /> : <Link2 size={14} />}
                </button>

                {/* Dropdown Trigger */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center justify-center px-1 h-full transition-colors rounded-r-md ${isAnyActive ? 'hover:bg-blue-500/30' : 'hover:bg-slate-800'}`}
                >
                    <ChevronDown size={12} />
                </button>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col py-1">

                    {/* Timeframe Item */}
                    <div
                        className="flex items-center justify-between px-3 py-2 hover:bg-slate-800 cursor-pointer group"
                        onClick={toggleTimeframe}
                    >
                        <div className="flex items-center gap-2 text-slate-300 group-hover:text-slate-100">
                            <ScanLine size={14} />
                            <span className="text-xs font-medium">Timeframe</span>
                        </div>

                        {/* Custom Switch Toggle */}
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${options.isTimeframeSync ? 'bg-blue-600' : 'bg-slate-600'}`}>
                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${options.isTimeframeSync ? 'left-4.5' : 'left-0.5'}`} style={{ left: options.isTimeframeSync ? 'calc(100% - 14px)' : '2px' }} />
                        </div>
                    </div>

                    {/* Crosshair Item */}
                    <div
                        className="flex items-center justify-between px-3 py-2 hover:bg-slate-800 cursor-pointer group"
                        onClick={togglePosition}
                    >
                        <div className="flex items-center gap-2 text-slate-300 group-hover:text-slate-100">
                            <Link size={14} />
                            <span className="text-xs font-medium">Cross/Scroll</span>
                        </div>

                        {/* Custom Switch Toggle */}
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${options.isPositionSync ? 'bg-blue-600' : 'bg-slate-600'}`}>
                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all`} style={{ left: options.isPositionSync ? 'calc(100% - 14px)' : '2px' }} />
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};
