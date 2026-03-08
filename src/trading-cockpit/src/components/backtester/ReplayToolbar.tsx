import React, { useState, useEffect, useRef } from 'react';
import { useBacktest } from '../../contexts/BacktestContext';
import { Play, Pause, SkipForward, GripVertical, Square } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

const formatStepTime = (date: number | string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(new Date(date));
};


export const ReplayToolbar: React.FC = () => {
    const { activeSession, stopSession, stepForward } = useBacktest();
    const [stepSizeMin, setStepSizeMin] = useState(1);
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const [speedMs, setSpeedMs] = useState(1000); // Defaults to 1000ms delay

    // Auto-step effect
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isAutoPlaying && activeSession) {
            timer = setTimeout(() => {
                // Expanding to most likely symbols currently visualized
                const symbols = useWorkspaceStore.getState().workspaces
                    .find(w => w.id === useWorkspaceStore.getState().activeWorkspaceId)?.panes.map(p => p.symbol) || ['EURUSD'];
                stepForward(stepSizeMin * 60000, symbols);
            }, speedMs);
        }
        return () => clearTimeout(timer);
    }, [isAutoPlaying, activeSession?.simulation_time, activeSession, speedMs, stepSizeMin, stepForward]);

    if (!activeSession) return null;

    const handleStepText = () => {
        const symbols = useWorkspaceStore.getState().workspaces
            .find(w => w.id === useWorkspaceStore.getState().activeWorkspaceId)?.panes.map(p => p.symbol) || ['EURUSD'];
        stepForward(stepSizeMin * 60000, symbols);
    };

    // Note: To match "speed" feeling where slider RIGHT = faster, we invert the MS scale.
    // E.g., Slider max 2000 means "fastest" (lowest delay, e.g. 50ms), min 100 means "slowest" (e.g. 2000ms delay)
    // Here we'll make the slider map from 1x to 20x.
    // Value 1 = 2000ms, Value 20 = 50ms
    const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        // Map 1-20 straight to milliseconds (Reverse correlation)
        // val 1 -> 2000ms
        // val 20 -> 50ms
        // Lerp: ms = 2000 - ((val - 1) * (1950 / 19))
        const delay = 2000 - ((val - 1) * (1950 / 19));
        setSpeedMs(Math.max(50, Math.round(delay)));
    };

    // Calculate slider value for derived state
    const sliderValue = Math.round(1 + ((2000 - speedMs) * 19) / 1950);

    return (
        <div className="flex items-center gap-3 h-full pr-2">

            {/* 1. Visual Grip */}
            <div className="flex items-center justify-center text-slate-400 dark:text-slate-600 border-r border-slate-300 dark:border-slate-700/50 pr-2 py-2">
                <GripVertical size={16} />
            </div>

            {/* 2. Speed Slider */}
            <div className="flex items-center gap-2 group px-2 border-r border-slate-300 dark:border-slate-700/50 h-full">
                <input
                    type="range"
                    min="1"
                    max="20"
                    value={sliderValue}
                    onChange={handleSpeedChange}
                    className="w-20 lg:w-24 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            </div>

            {/* 3. Play / Pause */}
            <div className="flex items-center gap-1 h-full">
                <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className={`w-7 h-7 flex items-center justify-center rounded transition-all shadow-sm border ${isAutoPlaying
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500 hover:bg-amber-200 dark:hover:bg-amber-500/30 border-amber-300 dark:border-amber-500/50'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                    title={isAutoPlaying ? "Pause Auto-Player" : "Play Auto-Player"}
                >
                    {isAutoPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                </button>

                {/* 4. Next Candle */}
                <button
                    onClick={handleStepText}
                    disabled={isAutoPlaying}
                    className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-transparent dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Next Candle (Step Forward)"
                >
                    <SkipForward size={16} fill="currentColor" />
                </button>
            </div>

            <div className="border-l border-slate-300 dark:border-slate-700/50 pl-3 flex h-full items-center">
                <select
                    value={stepSizeMin}
                    onChange={e => setStepSizeMin(Number(e.target.value))}
                    className="h-7 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-600 rounded text-[11px] font-bold px-2 outline-none cursor-pointer appearance-none text-center shadow-sm transition-colors"
                >
                    <option value={1}>1 Min</option>
                    <option value={3}>3 Min</option>
                    <option value={5}>5 Min</option>
                    <option value={15}>15 Min</option>
                    <option value={30}>30 Min</option>
                    <option value={60}>1 Hr</option>
                    <option value={240}>4 Hr</option>
                    <option value={1440}>1 Day</option>
                </select>
            </div>
        </div>
    );
};
