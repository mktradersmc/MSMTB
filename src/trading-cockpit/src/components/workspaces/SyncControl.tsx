
import React, { useEffect, useState } from 'react';
import { LayoutStateManager, SyncOptions } from '../../stores/LayoutStateManager';
import { Link, ScanLine, Info } from 'lucide-react';

export const SyncControl: React.FC = () => {
    const [options, setOptions] = useState<SyncOptions>({ isTimeframeSync: false, isPositionSync: false });
    const manager = LayoutStateManager.getInstance();

    useEffect(() => {
        // Initial State
        setOptions(manager.getOptions());

        // Polling or Subscription? 
        // For now, since we control it from here, local state is mostly sufficient,
        // but if we wanted true reactivity we'd need a subscribe method on the Manager.
        // Given constraints, we'll just push updates.
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

    return (
        <div className="flex items-center gap-0.5 bg-slate-900 rounded-md p-0.5 border border-slate-800">
            <button
                onClick={toggleTimeframe}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all ${options.isTimeframeSync
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                title="Sync Timeframe across all charts"
            >
                <ScanLine size={12} />
                <span>Interval</span>
            </button>

            <div className="w-px h-3 bg-slate-800 mx-1" />

            <button
                onClick={togglePosition}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all ${options.isPositionSync
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                title="Sync Crosshair & Scroll across all charts"
            >
                <Link size={12} />
                <span>Crosshair</span>
            </button>
        </div>
    );
};
