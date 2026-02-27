import React, { useEffect, useState } from 'react';
import { WorkspaceTabs } from './WorkspaceTabs';
import { LayoutGrid } from './LayoutGrid';
import { DrawingSidebar } from './DrawingSidebar';
import { LayoutSwitcher } from './LayoutSwitcher';
import { FinancialToolbar } from './FinancialToolbar';
import { SyncCenter } from './SyncCenter';
import { Settings, Maximize, Minimize, Calendar, FlaskConical, X } from 'lucide-react';
import { ChartSettingsDialog } from '../live/ChartSettingsDialog';
import { GoToDateModal } from '../charts/modals/GoToDateModal';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
// ... imports ...
import { TradesPanel } from '../trades/TradesPanel';
import { HistoryPanel } from '../trades/HistoryPanel';

interface WorkspaceShellProps {
    onNavigate?: (view: any) => void;
    accounts: any[];
    datafeedBotId: string;
    isDatafeedOnline: boolean;
    datafeedConfigError: boolean;
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
    onNavigate,
    accounts,
    datafeedBotId,
    isDatafeedOnline,
    datafeedConfigError
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isGoToDateOpen, setIsGoToDateOpen] = useState(false);

    // Panel States
    const [showTrades, setShowTrades] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // Browser Title Logic: Use the symbol of the currently ACTIVE chart pane
    const activeSymbol = useWorkspaceStore(state => {
        const activeW = state.workspaces.find(w => w.id === state.activeWorkspaceId);
        if (!activeW) return null;
        // Find the active pane, or fallback to the first one
        const activePane = activeW.panes.find(p => p.isActive);
        return activePane?.symbol || activeW.panes?.[0]?.symbol;
    });

    useEffect(() => {
        if (activeSymbol) {
            document.title = `${activeSymbol} | Awesome Cockpit`;
        } else {
            // Fallback handled by layout or page unmount, but good to reset
            document.title = 'Awesome Cockpit';
        }
    }, [activeSymbol]);

    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            if (containerRef.current) {
                containerRef.current.requestFullscreen().catch(err => {
                    console.error((`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`));
                });
            }
        } else {
            document.exitFullscreen();
        }
    };

    const handleGoToDate = (timestamp: number) => {
        const state = useWorkspaceStore.getState();
        const activeWorkspace = state.workspaces.find(w => w.id === state.activeWorkspaceId);

        if (activeWorkspace) {
            // Find active pane or default to first
            const activePane = activeWorkspace.panes.find(p => p.isActive) || activeWorkspace.panes[0];

            if (activePane) {
                state.requestScrollToTime(activePane.id, timestamp);
            }
        }
    };

    return (
        <div ref={containerRef} className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative">
            {/* Header Row 1: Workspace Tabs + Global Settings + Layout + Sync */}
            <header className="h-10 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 pl-[3.5rem] justify-between flex-shrink-0 z-[100] gap-4">
                {/* Workspace Tabs (Left) */}
                <div className="flex-1 min-w-0">
                    <WorkspaceTabs />
                </div>

                {/* Global Controls (Right) */}
                <div className="flex items-center gap-3 shrink-0">

                    {/* Segmented Mode Toggle */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md border border-slate-200 dark:border-slate-700 mr-2">
                        <button
                            onClick={() => useWorkspaceStore.getState().setIsTestMode(false)}
                            className={`
                            px-3 py-1 rounded-sm text-[10px] font-bold transition-all
                            ${!useWorkspaceStore(state => state.isTestMode)
                                    ? "bg-indigo-600 text-white shadow"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}
                            `}
                        >
                            LIVE
                        </button>
                        <button
                            onClick={() => useWorkspaceStore.getState().setIsTestMode(true)}
                            className={`
                            px-3 py-1 rounded-sm text-[10px] font-bold transition-all
                            ${useWorkspaceStore(state => state.isTestMode)
                                    ? "bg-amber-500 text-black shadow"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}
                            `}
                        >
                            TEST
                        </button>
                    </div>

                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />

                    {/* Go To Date */}
                    <button
                        onClick={() => setIsGoToDateOpen(true)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                        title="Go to Date..."
                    >
                        <Calendar size={18} />
                    </button>

                    {/* Layout Switcher */}
                    <LayoutSwitcher />

                    {/* Divider */}
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />

                    {/* Sync Controls */}
                    <SyncCenter />

                    {/* Divider */}
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />


                    <button
                        onClick={toggleFullscreen}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                    </button>

                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                        title="Global Chart Settings"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </header>

            {/* Main Content Area: Sidebar + Grid + Bottom Panel Overlay */}
            <div className="flex-1 relative flex flex-row min-h-0">
                {/* Left Sidebar: Drawing Tools */}
                <DrawingSidebar />

                {/* Center: Grid + Panels */}
                <div id="workspace-center-area" className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50 dark:bg-slate-950">

                    <div className="flex-1 relative overflow-hidden">
                        <LayoutGrid botId={datafeedBotId} accounts={accounts} isDatafeedOnline={isDatafeedOnline} />
                    </div>
                </div>
            </div>

            {/* Bottom Panels (Full Width) */}
            {showTrades && <TradesPanel onClose={() => setShowTrades(false)} />}
            {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}

            {/* Footer: Global Financial Toolbar */}
            <FinancialToolbar
                // botId={datafeedBotId}
                // isOnline={isDatafeedOnline}
                onToggleTrades={() => { setShowTrades(!showTrades); setShowHistory(false); }}
                onToggleHistory={() => { setShowHistory(!showHistory); setShowTrades(false); }}
                isTradesOpen={showTrades}
                isHistoryOpen={showHistory}
            />

            <ChartSettingsDialog
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            <GoToDateModal
                isOpen={isGoToDateOpen}
                onClose={() => setIsGoToDateOpen(false)}
                onGoTo={handleGoToDate}
            />
        </div>
    );
};
