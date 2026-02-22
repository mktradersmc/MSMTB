"use client";

import React, { useRef, useCallback, useEffect, useState } from 'react';

import { Settings, X, Eye, EyeOff } from 'lucide-react';
import { useWorkspaceStore, PaneConfig } from '../../stores/useWorkspaceStore';
import { ChartContainer, ChartContainerHandle } from '../charts/ChartContainer';
import { useChartData } from '../../hooks/useChartData';
import { useChartRegistryStore } from '../../stores/useChartRegistryStore';
import { ChartOverlay, ChartOverlayHandle } from './ChartOverlay';
import { useSymbolStore } from '../../stores/useSymbolStore';
import { LogicalRange } from 'lightweight-charts';
import { indicatorRegistry } from '../charts/indicators/IndicatorRegistry';
import { registerIndicators } from '../charts/indicators';
import { IndicatorSettingsDialog } from '../charts/settings/IndicatorSettingsDialog';
import { useChartTheme } from '../../context/ChartThemeContext';

interface ChartPaneProps {
    workspaceId: string;
    pane: PaneConfig;
    botId?: string;
    accounts: any[];
    isDatafeedOnline?: boolean;
}

export const ChartPane: React.FC<ChartPaneProps> = ({ workspaceId, pane, botId = 'MT5_Bot', accounts, isDatafeedOnline = true }) => {
    const { setActivePane, updatePane, toggleMaximizePane, workspaces } = useWorkspaceStore();
    const activeWorkspace = workspaces.find(w => w.id === workspaceId);
    const isMaximized = activeWorkspace?.maximizedPaneId === pane.id;
    const maximizeId = activeWorkspace?.maximizedPaneId;

    useEffect(() => {
        // If the maximization state changes (any pane maximized or restored), close local popups
        if (chartRef.current) {
            chartRef.current.closePopups();
        }
        if (overlayRef.current) {
            overlayRef.current.closePopups();
        }
    }, [maximizeId]);

    // Cleanup Selection on Deactivation
    useEffect(() => {
        if (!pane.isActive && chartRef.current) {
            chartRef.current.deselectAll();
        }
    }, [pane.isActive, pane.id]);

    // --- STATE PERSISTENCE ---
    const lastLogicalRangeRef = useRef<LogicalRange | null>(null);

    // --- INDICATOR STATE ---
    const [activeIndicators, setActiveIndicators] = useState<any[]>(pane.indicators || []);
    const [editingIndicatorId, setEditingIndicatorId] = useState<string | null>(null);

    // Init Registry (Once)
    useEffect(() => {
        registerIndicators();
    }, []);

    const { registerChart, unregisterChart } = useChartRegistryStore();
    const chartRef = useRef<ChartContainerHandle>(null);
    const overlayRef = useRef<ChartOverlayHandle>(null);
    const { getSymbolInfo } = useSymbolStore();
    const [layoutManager] = useState(() => import('../../stores/LayoutStateManager').then(m => m.LayoutStateManager.getInstance()));

    // Keep track of latest timeframe to avoid stale closures in sync callbacks
    const timeframeRef = useRef(pane.timeframe);
    useEffect(() => {
        timeframeRef.current = pane.timeframe;
    }, [pane.timeframe]);


    // --- INTEGRATION: LayoutStateManager ---
    useEffect(() => {
        let manager: any = null;

        const initManager = async () => {
            const { LayoutStateManager } = await import('../../stores/LayoutStateManager');
            manager = LayoutStateManager.getInstance();

            manager.register({
                id: pane.id,
                setTimeframe: (tf: string) => {
                    updatePane(workspaceId, pane.id, { timeframe: tf });
                },
                getTimeframe: () => {
                    return timeframeRef.current;
                },
                setVisibleRange: (range: { from: number; to: number }) => {
                    if (chartRef.current) {
                        chartRef.current.setVisibleRange(range);
                    }
                },
                setLogicalRange: (range: { from: number; to: number, anchorTime?: number }) => {
                    if (chartRef.current) {
                        chartRef.current.setLogicalRange(range);
                    }
                },
                setCrosshair: (time: number, price?: number) => {
                    if (chartRef.current) {
                        chartRef.current.setCrosshair(time, price);
                    }
                }
            });
        };

        initManager();

        return () => {
            if (manager) {
                manager.unregister(pane.id);
            }
        };
    }, [pane.id, workspaceId, updatePane]);

    // Register Chart to Registry & Manage Persistence
    useEffect(() => {
        // console.log(`[ChartPane:${pane.id}] Mount/Register Effect`);
        if (chartRef.current) {
            registerChart(pane.id, chartRef.current);

            // --- DRAWING PERSISTENCE ---
            const widget = chartRef.current.getWidget();
            if (widget) {
                // 1. Hydrate
                if (pane.drawings) {
                    try {
                        console.log(`[ChartPane:${pane.id}] Hydrating drawings...`);
                        widget.hydrateDrawings(pane.drawings);
                    } catch (e) {
                        console.warn(`[ChartPane:${pane.id}] Failed to hydrate drawings:`, e);
                    }
                }

                // 2. Setup Persistence
                const saveDrawings = () => {
                    if (!widget) return;
                    try {
                        const serialized = widget.serializeDrawings();
                        // Only save if meaningful content or actual changes
                        // We always save on unmount to capture final state
                        updatePane(workspaceId, pane.id, { drawings: serialized });
                    } catch (e) {
                        console.warn(`[ChartPane:${pane.id}] Failed to save drawings:`, e);
                    }
                };

                // Save on structure changes (add/remove)
                widget.subscribe('drawing', saveDrawings);

                // Save on execution (trade) just to be safe? 
                // widget.subscribe('execute', saveDrawings);

                return () => {
                    console.log(`[ChartPane:${pane.id}] Unmounting/Unregistering. Saving drawings...`);
                    saveDrawings();
                    widget.unsubscribe('drawing', saveDrawings);
                    unregisterChart(pane.id);
                };
            }
        }
        return () => {
            console.log(`[ChartPane:${pane.id}] Cleanup/Unregister (No Widget Path)`);
            unregisterChart(pane.id);
        }
    }, [pane.id, registerChart, unregisterChart, workspaceId, updatePane]); // Important: Exclude pane.drawings to prevent re-hydration loops

    // Optimized Tick Handler
    const handleTick = useCallback((candle: any) => {
        if (chartRef.current) {
            chartRef.current.updateCandle(candle);
        }
    }, []);

    // Data Hook
    const { data, horizonData, isLoading, isChartReady, syncError, syncStatus } = useChartData({
        symbol: pane.symbol,
        timeframe: pane.timeframe,
        botId: botId,
        isActivePane: pane.isActive,
        onTick: handleTick
    });

    const handleFocus = () => {
        setActivePane(workspaceId, pane.id);
        import('../../stores/LayoutStateManager').then(({ LayoutStateManager }) => {
            LayoutStateManager.getInstance().setLastActive(pane.id);
        });
    };

    // --- INTERACTION: Keyboard Shortcut (Alt + Enter) ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (pane.isActive && e.altKey && e.key === 'Enter') {
                e.preventDefault();
                toggleMaximizePane(workspaceId, pane.id);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [pane.isActive, toggleMaximizePane, workspaceId, pane.id]);

    const symbolInfo = getSymbolInfo(pane.symbol);
    const precision = symbolInfo?.digits || 5;

    // --- TIMEFRAME SCROLL LOGIC (Local) ---
    const tfScrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkTfScroll = () => {
        if (tfScrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tfScrollRef.current;
            setCanScrollLeft(scrollLeft > 4);
            setCanScrollRight(Math.ceil(scrollWidth) > Math.ceil(clientWidth + scrollLeft) + 4);
        }
    };

    // Timezone State (Local for now, could be in PaneConfig)
    const [timezone, setTimezone] = useState<string>(() => {
        try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return 'UTC'; }
    });

    useEffect(() => {
        const el = tfScrollRef.current;
        if (el) {
            checkTfScroll();
            el.addEventListener('scroll', checkTfScroll);
            const observer = new ResizeObserver(() => checkTfScroll());
            observer.observe(el);
            return () => {
                el.removeEventListener('scroll', checkTfScroll);
                observer.disconnect();
            };
        }
    }, []);

    const [ohlc, setOhlc] = useState<{ open: number, high: number, low: number, close: number } | null>(null);

    // --- MANAGE OUTGOING EVENTS (Source) ---
    const handleCallbackTimeframeChange = (tf: string) => {
        updatePane(workspaceId, pane.id, { timeframe: tf });
        // Broadcast sync
        import('../../stores/LayoutStateManager').then(({ LayoutStateManager }) => {
            LayoutStateManager.getInstance().syncTimeframe(pane.id, tf);
        });
    };

    const handleCallbackCrosshairMove = (time: any, priceA: number | undefined, priceB: number | undefined) => {
        if (time) {
            import('../../stores/LayoutStateManager').then(({ LayoutStateManager }) => {
                LayoutStateManager.getInstance().syncCrosshair(pane.id, time as number, priceA || 0);
            });
        }
    };

    const handleCallbackVisibleRangeChange = (range: { from: number, to: number }) => {
        import('../../stores/LayoutStateManager').then(({ LayoutStateManager }) => {
            LayoutStateManager.getInstance().syncScroll(pane.id, range);
        });
    };

    const handleCallbackLogicalRangeChange = (logicalRange: LogicalRange & { anchorTime?: number, whitespaceOffset?: number }) => {
        const currentRange = { from: 0, to: 0 }; // We only need logical range for primary sync
        if (logicalRange) {
            lastLogicalRangeRef.current = logicalRange;
        }
        import('../../stores/LayoutStateManager').then(({ LayoutStateManager }) => {
            LayoutStateManager.getInstance().syncScroll(pane.id, currentRange, {
                from: logicalRange.from as number,
                to: logicalRange.to as number,
                anchorTime: logicalRange.anchorTime,
                whitespaceOffset: logicalRange.whitespaceOffset
            });
        });
    };

    // --- INDICATOR HANDLERS ---
    const handleAddIndicator = (defId: string) => {
        const def = indicatorRegistry.get(defId);
        if (!def) return;

        // Create new instance (generic add, unique instance IDs)
        const newItem = {
            instanceId: `${defId}_${Date.now()}`,
            defId: defId,
            settings: { ...def.defaultSettings },
            visible: true
        };

        const newIndicators = [...activeIndicators, newItem];
        setActiveIndicators(newIndicators);

        // Save to Persistent Store
        updatePane(workspaceId, pane.id, { indicators: newIndicators });

        // Open Settings
        setEditingIndicatorId(newItem.instanceId);
    };

    const handleSaveSettings = (newSettings: any) => {
        if (!editingIndicatorId) return;

        const newIndicators = activeIndicators.map(ind => {
            if (ind.instanceId === editingIndicatorId) {
                return { ...ind, settings: newSettings };
            }
            return ind;
        });
        setActiveIndicators(newIndicators);
        setEditingIndicatorId(null);

        // Save to Persistent Store
        updatePane(workspaceId, pane.id, { indicators: newIndicators });
    };

    const handleRemoveIndicator = (id: string) => {
        const newIndicators = activeIndicators.filter(i => i.instanceId !== id);
        setActiveIndicators(newIndicators);
        if (editingIndicatorId === id) setEditingIndicatorId(null);

        // Save to Persistent Store
        updatePane(workspaceId, pane.id, { indicators: newIndicators });
    };

    // Get Definition for editing
    const handleToggleVisibility = (id: string) => {
        const newIndicators = activeIndicators.map(ind => {
            if (ind.instanceId === id) {
                return { ...ind, visible: ind.visible === undefined ? false : !ind.visible };
            }
            return ind;
        });
        setActiveIndicators(newIndicators);
        // Save to Persistent Store
        updatePane(workspaceId, pane.id, { indicators: newIndicators });
    };

    const editingInd = activeIndicators.find(i => i.instanceId === editingIndicatorId);
    const editingDef = editingInd ? indicatorRegistry.get(editingInd.defId) : null;

    // --- THEME CONTEXT ---
    const { mode } = useChartTheme();
    const isDark = mode === 'dark';
    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const mutedColor = isDark ? 'text-slate-500' : 'text-slate-400';
    const iconColor = isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900';
    const borderColor = isDark ? 'hover:border-slate-700' : 'hover:border-slate-300';

    // RESTORE RANGE ON MAXIMIZE/MINIMIZE
    // When isMaximized changes, the component effectively moves in the DOM.
    // LWC might reset. We force re-apply the last known logical range after a brief delay to allow resize to settle.
    React.useLayoutEffect(() => {
        if (lastLogicalRangeRef.current && chartRef.current) {
            const saved = lastLogicalRangeRef.current;
            // Small timeout to allow the resize observer in ChartContainer to fire first
            const t = setTimeout(() => {
                if (chartRef.current) {
                    chartRef.current.setLogicalRange({ from: saved.from as number, to: saved.to as number });
                }
            }, 50);
            return () => clearTimeout(t);
        }
    }, [isMaximized]);

    return (
        <div
            className={`
                flex flex-col w-full h-full overflow-hidden bg-white dark:bg-slate-950 transition-all duration-200 group
                ${isMaximized
                    ? 'absolute inset-0 z-[90] border-0'
                    : `relative ${pane.isActive ? 'border-2 border-blue-500 z-10' : 'border border-slate-200 dark:border-slate-800'}`
                }
            `}
            // Remove 100vw/100vh inline styles as fixed inset-0 handles it better without causing scrollbars
            onClick={(e) => {
                // Alt + Click to Toggle Maximize
                if (e.altKey && !e.shiftKey && !e.ctrlKey) {
                    e.stopPropagation();
                    toggleMaximizePane(workspaceId, pane.id);
                    return;
                }
                handleFocus();
            }}
        >
            {/* --- IN-CHART HUD OVERLAY --- */}
            <ChartOverlay
                ref={overlayRef}
                symbol={pane.symbol}
                timeframe={pane.timeframe}
                timezone={timezone}
                onSymbolChange={(s) => updatePane(workspaceId, pane.id, { symbol: s })}
                onTimeframeChange={handleCallbackTimeframeChange}
                onTimezoneChange={(tz) => setTimezone(tz)}
                onAddIndicator={handleAddIndicator}
                botId={botId}
                ohlc={ohlc}
                precision={precision}
                status={syncStatus as any}
                isDatafeedOnline={isDatafeedOnline}
            />

            {/* Chart Wrapper */}
            <div className="flex-1 min-h-0 relative">
                <ChartContainer
                    ref={chartRef}
                    symbol={pane.symbol}
                    symbolB=""
                    dataA={data}
                    dataB={[]}
                    timeframe={pane.timeframe}
                    height="100%"
                    isLoading={isLoading && data.length === 0}
                    precision={precision}
                    horizonData={horizonData}
                    accounts={accounts}
                    botId={botId}
                    isActive={pane.isActive}
                    timezone={timezone}
                    onOHLCChange={setOhlc}
                    onCrosshairMove={handleCallbackCrosshairMove}
                    // onVisibleRangeChange={handleCallbackVisibleRangeChange} // Disabled to prevent Time-Sync Jitter. We rely on LogicalRange.
                    onVisibleLogicalRangeChange={handleCallbackLogicalRangeChange}
                    activeIndicators={activeIndicators}
                    paneId={pane.id}
                    onChartClick={handleFocus}
                    scrollToTimeRequest={pane.scrollToTimeRequest}
                    isChartReady={isChartReady && data.length > 0} // Logical AND: Data must exist too
                    syncError={syncError}
                />

                {/* ACTIVE INDICATORS OVERLAY LABEL */}
                <div className="absolute top-[50px] left-1 flex flex-col items-start gap-0.5 z-20 pointer-events-auto select-none">
                    {activeIndicators.map(ind => {
                        const def = indicatorRegistry.get(ind.defId);
                        // Adapted Text Colors based on Chart Theme
                        return (
                            <div key={ind.instanceId}
                                className={`flex items-center gap-1 group/legend px-1 py-0.5 border border-transparent rounded ${borderColor} transition-all`}
                            >
                                <span className={`text-sm cursor-default ${ind.visible === false ? `${mutedColor} line-through decoration-slate-500` : textColor}`}>
                                    {def?.name || ind.defId}
                                </span>
                                <div className="flex items-center gap-0 opacity-0 group-hover/legend:opacity-100 transition-opacity duration-200 ml-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleToggleVisibility(ind.instanceId); }}
                                        className={`${iconColor} p-0.5 transition-colors`}
                                        title={ind.visible === false ? "Show" : "Hide"}
                                    >
                                        {ind.visible === false ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditingIndicatorId(ind.instanceId); }}
                                        className={`${iconColor} p-0.5 transition-colors`}
                                        title="Settings"
                                    >
                                        <Settings size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRemoveIndicator(ind.instanceId); }}
                                        className={`${iconColor} p-0.5 transition-colors`}
                                        title="Close"
                                    >
                                        {/* Smaller and Thicker X */}
                                        <X size={12} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* SETTINGS DIALOG */}
                {editingInd && editingDef && (
                    <IndicatorSettingsDialog
                        isOpen={true}
                        onClose={() => setEditingIndicatorId(null)}
                        onSave={handleSaveSettings}
                        definition={{ name: editingDef.name, settingsSchema: editingDef.settingsSchema }}
                        currentSettings={editingInd.settings}
                    />
                )}
            </div>
        </div >
    );
};
