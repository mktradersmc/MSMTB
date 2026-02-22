"use client";

import React, { useMemo, useCallback, useState } from 'react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { ChartPane } from './ChartPane';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle, Layout } from 'react-resizable-panels';

interface LayoutGridProps {
    botId?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accounts: any[];
    isDatafeedOnline?: boolean;
}

const DraggableGutter = ({ direction = "horizontal", onDoubleClick }: { direction?: "horizontal" | "vertical", onDoubleClick?: () => void }) => (
    <PanelResizeHandle
        className={`
        relative flex items-center justify-center
        ${direction === 'horizontal' ? 'w-1 cursor-col-resize hover:bg-blue-500/20' : 'h-1 cursor-row-resize hover:bg-blue-500/20'}
        group outline-none transition-colors duration-200
    `}
        onDoubleClick={onDoubleClick}
    >
        <div className={`
            absolute bg-slate-200 dark:bg-slate-800 transition-colors duration-200
            group-hover:bg-blue-500 group-active:bg-blue-600
            ${direction === 'horizontal' ? 'w-1 h-full' : 'h-1 w-full'}
            z-10
        `} />
    </PanelResizeHandle>
);

export const LayoutGrid: React.FC<LayoutGridProps> = ({ botId, accounts, isDatafeedOnline = true }) => {
    const { workspaces, activeWorkspaceId, updateLayoutSizes } = useWorkspaceStore();

    // State to force remount of PanelGroups by changing their key
    const [groupVersions, setGroupVersions] = useState<Record<string, number>>({});

    const activeWorkspace = useMemo(() =>
        workspaces.find(w => w.id === activeWorkspaceId),
        [workspaces, activeWorkspaceId]);

    const { layoutType, panes, layoutSizes = [] } = activeWorkspace || {};

    const getPaneId = useCallback((index: number) => {
        if (!panes) return `pane-fallback-${index}`;
        return panes[index]?.id || `pane-fallback-${index}`;
    }, [panes]);

    // Helper to merge new sizes into the flat layoutSizes array
    const handleLayoutChange = useCallback((indices: number[], ids: string[], layoutMap: Layout) => {
        if (!activeWorkspace) return;

        const currentSizes = [...(activeWorkspace.layoutSizes || [])];
        // Ensure array is large enough
        while (currentSizes.length < 6) currentSizes.push(50);

        // Map the IDs back to the indices provided
        indices.forEach((globalIndex, i) => {
            const id = ids[i];
            if (layoutMap[id] !== undefined) {
                currentSizes[globalIndex] = layoutMap[id];
            }
        });

        updateLayoutSizes(activeWorkspace.id, currentSizes);
    }, [activeWorkspace, updateLayoutSizes]);

    const handleResetLayout = useCallback((groupId: string, indices: number[], targetValue: number = 50) => {
        if (!activeWorkspace) return;

        const currentSizes = [...(activeWorkspace.layoutSizes || [])];
        // Ensure array is large enough
        while (currentSizes.length < 6) currentSizes.push(50);

        indices.forEach(index => {
            currentSizes[index] = targetValue;
        });

        // 1. Update persisted store
        updateLayoutSizes(activeWorkspace.id, currentSizes);

        // 2. Force remount of the specific group
        setGroupVersions(prev => ({
            ...prev,
            [groupId]: (prev[groupId] || 0) + 1
        }));
    }, [activeWorkspace, updateLayoutSizes]);

    const getSize = useCallback((index: number, defaultVal: number = 50) => {
        return (layoutSizes && layoutSizes[index]) ?? defaultVal;
    }, [layoutSizes]);

    const renderPane = (index: number) => {
        if (!panes || !activeWorkspace) return null;
        const pane = panes[index];
        if (!pane) return <div className="bg-slate-50 dark:bg-slate-900 w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">Empty Pane</div>;
        return (
            <div className="w-full h-full bg-white dark:bg-slate-900 overflow-hidden">
                <ChartPane
                    key={pane.id}
                    workspaceId={activeWorkspace.id}
                    pane={pane}
                    botId={botId}
                    accounts={accounts}
                    isDatafeedOnline={isDatafeedOnline}
                />
            </div>
        );
    };

    if (!activeWorkspace) {
        return <div className="p-10 text-center text-slate-500">No active workspace</div>;
    }

    // --- RENDERERS ---

    const layoutContent = () => {
        if (layoutType === 'single') {
            return (
                <div className="w-full h-full bg-white dark:bg-slate-950">
                    {renderPane(0)}
                </div>
            );
        }

        if (layoutType === 'split-vertical') {
            const ids = [getPaneId(0), getPaneId(1)];
            const groupId = 'main-group';
            return (
                <div className="w-full h-full bg-slate-950">
                    <PanelGroup
                        key={`${groupId}-${groupVersions[groupId] || 0}`}
                        orientation="horizontal"
                        onLayoutChanged={(l) => handleLayoutChange([0, 1], ids, l)}
                    >
                        <Panel id={ids[0]} defaultSize={getSize(0)} minSize={10} className="">
                            {renderPane(0)}
                        </Panel>
                        <DraggableGutter
                            direction="horizontal"
                            onDoubleClick={() => handleResetLayout(groupId, [0, 1], 50)}
                        />
                        <Panel id={ids[1]} defaultSize={getSize(1)} minSize={10} className="">
                            {renderPane(1)}
                        </Panel>
                    </PanelGroup>
                </div>
            );
        }

        if (layoutType === 'split-horizontal') {
            const ids = [getPaneId(0), getPaneId(1)];
            const groupId = 'main-group';
            return (
                <div className="w-full h-full bg-slate-950">
                    <PanelGroup
                        key={`${groupId}-${groupVersions[groupId] || 0}`}
                        orientation="vertical"
                        onLayoutChanged={(l) => handleLayoutChange([0, 1], ids, l)}
                    >
                        <Panel id={ids[0]} defaultSize={getSize(0)} minSize={10} className="">
                            {renderPane(0)}
                        </Panel>
                        <DraggableGutter
                            direction="vertical"
                            onDoubleClick={() => handleResetLayout(groupId, [0, 1], 50)}
                        />
                        <Panel id={ids[1]} defaultSize={getSize(1)} minSize={10} className="">
                            {renderPane(1)}
                        </Panel>
                    </PanelGroup>
                </div>
            );
        }

        if (layoutType === 'grid-2x2') {
            // IDs for columns and cells
            const colIds = ['col-0', 'col-1'];
            const leftIds = [getPaneId(0), getPaneId(2)];
            const rightIds = [getPaneId(1), getPaneId(3)];

            const mainGroupId = 'main-group';
            const leftGroupId = 'left-col-group';
            const rightGroupId = 'right-col-group';

            return (
                <div className="w-full h-full bg-white dark:bg-slate-950">
                    <PanelGroup
                        key={`${mainGroupId}-${groupVersions[mainGroupId] || 0}`}
                        orientation="horizontal"
                        onLayoutChanged={(l) => handleLayoutChange([0, 1], colIds, l)}
                    >
                        {/* Left Column */}
                        <Panel id={colIds[0]} defaultSize={getSize(0)} minSize={10} className="flex flex-col">
                            <PanelGroup
                                key={`${leftGroupId}-${groupVersions[leftGroupId] || 0}`}
                                orientation="vertical"
                                onLayoutChanged={(l) => handleLayoutChange([2, 3], leftIds, l)}
                            >
                                <Panel id={leftIds[0]} defaultSize={getSize(2)} minSize={10} className="">
                                    {renderPane(0)}
                                </Panel>
                                <DraggableGutter
                                    direction="vertical"
                                    onDoubleClick={() => handleResetLayout(leftGroupId, [2, 3], 50)}
                                />
                                <Panel id={leftIds[1]} defaultSize={getSize(3)} minSize={10} className="">
                                    {renderPane(2)}
                                </Panel>
                            </PanelGroup>
                        </Panel>

                        <DraggableGutter
                            direction="horizontal"
                            onDoubleClick={() => handleResetLayout(mainGroupId, [0, 1], 50)} // Reset columns to 50/50
                        />

                        {/* Right Column */}
                        <Panel id={colIds[1]} defaultSize={getSize(1)} minSize={10} className="flex flex-col">
                            <PanelGroup
                                key={`${rightGroupId}-${groupVersions[rightGroupId] || 0}`}
                                orientation="vertical"
                                onLayoutChanged={(l) => handleLayoutChange([4, 5], rightIds, l)}
                            >
                                <Panel id={rightIds[0]} defaultSize={getSize(4)} minSize={10} className="">
                                    {renderPane(1)}
                                </Panel>
                                <DraggableGutter
                                    direction="vertical"
                                    onDoubleClick={() => handleResetLayout(rightGroupId, [4, 5], 50)}
                                />
                                <Panel id={rightIds[1]} defaultSize={getSize(5)} minSize={10} className="">
                                    {renderPane(3)}
                                </Panel>
                            </PanelGroup>
                        </Panel>
                    </PanelGroup>
                </div>
            );
        }

        if (layoutType === 'grid-1-2') {
            const colIds = ['col-main', 'col-split'];
            const subIds = [getPaneId(1), getPaneId(2)];

            const mainGroupId = 'main-group';
            const subGroupId = 'sub-split-group';

            return (
                <div className="w-full h-full bg-white dark:bg-slate-950">
                    <PanelGroup
                        key={`${mainGroupId}-${groupVersions[mainGroupId] || 0}`}
                        orientation="horizontal"
                        onLayoutChanged={(l) => handleLayoutChange([0, 1], colIds, l)}
                    >
                        {/* Left Main */}
                        <Panel id={colIds[0]} defaultSize={getSize(0, 66)} minSize={20} className="">
                            {renderPane(0)}
                        </Panel>

                        <DraggableGutter
                            direction="horizontal"
                            onDoubleClick={() => handleResetLayout(mainGroupId, [0, 1], 50)}
                        />

                        {/* Right Split */}
                        <Panel id={colIds[1]} defaultSize={getSize(1, 34)} minSize={20} className="flex flex-col">
                            <PanelGroup
                                key={`${subGroupId}-${groupVersions[subGroupId] || 0}`}
                                orientation="vertical"
                                onLayoutChanged={(l) => handleLayoutChange([2, 3], subIds, l)}
                            >
                                <Panel id={subIds[0]} defaultSize={getSize(2)} minSize={10} className="">
                                    {renderPane(1)}
                                </Panel>
                                <DraggableGutter
                                    direction="vertical"
                                    onDoubleClick={() => handleResetLayout(subGroupId, [2, 3], 50)}
                                />
                                <Panel id={subIds[1]} defaultSize={getSize(3)} minSize={10} className="">
                                    {renderPane(2)}
                                </Panel>
                            </PanelGroup>
                        </Panel>
                    </PanelGroup>
                </div>
            );
        }

        return <div>Unknown Layout</div>;
    };

    return (
        <div id="workspace-grid-root" className="relative w-full h-full">
            {layoutContent()}
        </div>
    );
};
