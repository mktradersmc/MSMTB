import React from 'react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useChartRegistryStore } from '../../stores/useChartRegistryStore';
import { MagnetControl } from '../charts/MagnetControl';
import {
    MousePointer2,
    Minus,
    ArrowRight
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

export const DrawingSidebar: React.FC = () => {
    const { activeWorkspaceId, workspaces } = useWorkspaceStore();
    const { getChart } = useChartRegistryStore();

    // Helper to execute command on active pane
    const executeOnActiveChart = (callback: (widget: any, pane: any) => void) => {
        const workspace = workspaces.find(w => w.id === activeWorkspaceId);
        if (!workspace) return;

        // Diagnostic: Check for multiple active panes
        const activePanes = workspace.panes.filter(p => p.isActive);
        if (activePanes.length > 1) {
            console.warn(`[DrawingSidebar] CRITICAL: Multiple panes are active! IDs: ${activePanes.map(p => p.id).join(', ')}`);
        }

        const activePane = activePanes[0];
        if (!activePane) {
            alert("No active chart selected.");
            return;
        }

        console.log(`[DrawingSidebar] Targeting Active Pane: ${activePane.id}`);

        const chartHandle = getChart(activePane.id);
        if (!chartHandle) {
            console.error(`[DrawingSidebar] No handle found for pane ${activePane.id}`);
            return;
        }

        const widget = chartHandle.getWidget();
        if (widget) {
            // Optional: Check if widget ID matches pane ID (requires updating ChartWidget)
            if ((widget as any).id && (widget as any).id !== activePane.id) {
                console.error(`[DrawingSidebar] ID MISMATCH! Pane: ${activePane.id}, Widget: ${(widget as any).id}`);
            }
            callback(widget, activePane);
        } else {
            console.error(`[DrawingSidebar] Handle found but getWidget() returned null for pane ${activePane.id}`);
        }
    };

    const handleToolClick = (toolName: string) => {
        executeOnActiveChart((widget, pane) => {
            const data = (widget as any)._data;
            if (!data || data.length === 0) {
                alert("No data available to place object.");
                return;
            }

            const latest = data[data.length - 1];
            if (!latest) return;

            const time = latest.time as number;
            const price = latest.close as number;

            // Mapping
            let shapeType = '';
            let overrides = {};

            if (toolName === 'HorizontalLine') shapeType = 'HorizontalLine';
            if (toolName === 'HorizontalRay') shapeType = 'HorizontalRay';
            if (toolName === 'VerticalLine') shapeType = 'VerticalLine';
            if (toolName === 'Long') shapeType = 'Riskrewardlong';
            if (toolName === 'Short') shapeType = 'Riskrewardshort';
            if (toolName === 'TradeBuilder') shapeType = 'TradeBuilder';

            if (shapeType) {
                widget.createShape(
                    { time, price },
                    { shape: shapeType, overrides, disableSelection: false }
                );
                console.log(`[DrawingSidebar] Created ${shapeType} at ${time}, ${price}`);
            }
        });
    };

    const btnClass = "p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-slate-500 dark:text-slate-400";

    return (
        <div className="flex flex-col items-center gap-4 py-4 w-12 border-r border-slate-200 dark:border-slate-700 relative z-[100] pointer-events-auto">
            {/* 1. Crosshair/Cursor */}
            <button
                onClick={() => handleToolClick('Cursor')}
                className={btnClass}
                title="Crosshair"
            >
                <MousePointer2 size={20} strokeWidth={1.5} className="pointer-events-none" />
            </button>

            <div className="w-6 h-px bg-slate-200 dark:bg-slate-800" />

            {/* 2. Line Tools */}
            <div className="flex flex-col gap-2">
                <button
                    onClick={() => handleToolClick('HorizontalLine')}
                    className={btnClass}
                    title="Horizontal Line"
                >
                    <Minus size={20} strokeWidth={1.5} className="pointer-events-none" />
                </button>
                <button
                    onClick={() => handleToolClick('VerticalLine')}
                    className={btnClass}
                    title="Vertical Line"
                >
                    <Minus size={20} strokeWidth={1.5} className="pointer-events-none rotate-90" />
                </button>
                <button
                    onClick={() => handleToolClick('HorizontalRay')}
                    className={btnClass}
                    title="Horizontal Ray"
                >
                    <ArrowRight size={20} strokeWidth={1.5} className="pointer-events-none" />
                </button>
            </div>

            <div className="w-6 h-px bg-slate-200 dark:bg-slate-800" />

            {/* 3. Prediction Tools */}
            <div className="flex flex-col gap-2">
                <button
                    onClick={() => handleToolClick('Long')}
                    className={btnClass}
                    title="Long Position"
                >
                    <LongPosIcon />
                </button>
                <button
                    onClick={() => handleToolClick('Short')}
                    className={btnClass}
                    title="Short Position"
                >
                    <ShortPosIcon />
                </button>
                <button
                    onClick={() => handleToolClick('TradeBuilder')}
                    className={btnClass}
                    title="Trade Builder"
                >
                    <TradeBuilderIcon />
                </button>
            </div>

            <div className="w-6 h-px bg-slate-200 dark:bg-slate-800" />

            {/* 4. Magnet */}
            <div className="scale-75 origin-center">
                <MagnetControl side="right" />
            </div>
        </div>
    );
};
