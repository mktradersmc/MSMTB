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

    // Draggable State
    const [position, setPosition] = useState({ x: 0, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

    // Initial Centering Effect
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setPosition({ x: window.innerWidth / 2 - 250, y: 20 });
        }
    }, []);

    // Pointer Drag Logic
    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialX: position.x,
            initialY: position.y
        };
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || !dragRef.current) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setPosition({
            x: dragRef.current.initialX + dx,
            y: dragRef.current.initialY + dy
        });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

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
        <div
            className="fixed z-[9999] bg-slate-900/95 backdrop-blur-md border border-slate-700/50 shadow-2xl rounded-full p-2 flex items-center justify-between gap-3 min-w-[500px] transition-shadow duration-200"
            style={{
                left: position.x,
                top: position.y,
                cursor: isDragging ? 'grabbing' : 'default',
                boxShadow: isDragging ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)' : '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15)'
            }}
        >
            {/* 1. Drag Grip */}
            <div
                className="pl-2 pr-1 text-slate-500 hover:text-white cursor-grab active:cursor-grabbing transition-colors h-full flex items-center"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                title="Drag Toolbar"
            >
                <GripVertical size={20} />
            </div>

            {/* 2. Speed Slider */}
            <div className="flex items-center gap-2 group px-2 border-r border-slate-700/50">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest group-hover:text-blue-400 transition-colors">Speed</span>
                <input
                    type="range"
                    min="1"
                    max="20"
                    value={sliderValue}
                    onChange={handleSpeedChange}
                    className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            </div>

            {/* 3. Play / Pause */}
            <div className="flex items-center gap-1">
                <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all shadow-lg ${isAutoPlaying
                        ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 ring-1 ring-amber-500/50'
                        : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-105'
                        }`}
                    title={isAutoPlaying ? "Pause Auto-Player" : "Play Auto-Player"}
                >
                    {isAutoPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
                </button>

                {/* 4. Next Candle */}
                <button
                    onClick={handleStepText}
                    disabled={isAutoPlaying}
                    className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-all disabled:opacity-20 disabled:hover:bg-transparent"
                    title="Next Candle (Step Forward)"
                >
                    <SkipForward size={20} fill="currentColor" />
                </button>
            </div>

            {/* 5. Step Time Display */}
            <div className="flex flex-col items-end justify-center px-4 border-l border-slate-700/50">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Step Time</span>
                <span className="text-sm font-mono font-bold text-emerald-400 tabular-nums shadow-sm whitespace-nowrap">
                    {activeSession.simulation_time ? formatStepTime(activeSession.simulation_time) : '...'}
                </span>
            </div>

            <div className="border-l border-slate-700/50 pl-2 pr-1">
                <select
                    value={stepSizeMin}
                    onChange={e => setStepSizeMin(Number(e.target.value))}
                    className="h-8 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-md text-xs font-bold px-3 py-1 outline-none cursor-pointer appearance-none text-center shadow-inner transition-colors"
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
