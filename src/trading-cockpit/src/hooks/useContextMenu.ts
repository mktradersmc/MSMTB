import { useState, useCallback, useEffect } from 'react';
import { ChartWidget } from '../components/charts/widgets/ChartWidget';
import { SettingField, InteractiveChartObject } from '../components/charts/widgets/InteractiveChartObject';
import { IChartShape } from '../components/charts/widgets/api';

export interface ContextMenuState {
    visible: boolean;
    x: number;
    y: number;
    type: 'widget' | 'global';
    targetId?: string; // For widget menu
}

export interface SettingsState {
    isOpen: boolean;
    schema: SettingField[];
    targetShape: IChartShape | null;
}

export const useContextMenu = (
    containerRef: React.RefObject<HTMLDivElement | null>,
    chartWidgetRef: React.MutableRefObject<ChartWidget | null>
) => {
    const [menuState, setMenuState] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, type: 'global' });
    const [settingsState, setSettingsState] = useState<SettingsState>({ isOpen: false, schema: [], targetShape: null });

    const handleContextMenu = useCallback((e: MouseEvent) => {
        e.preventDefault();

        if (!containerRef.current || !chartWidgetRef.current) return;

        // 1. Coordinate Translation
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 2. Hit Test
        // Note: chartWidgetRef.current.hitTest must iterate in reverse order
        const hitShape = chartWidgetRef.current.hitTest(x, y);

        if (hitShape) {
            // Scenario A: Widget Clicked
            setMenuState({
                visible: true,
                x: e.clientX, // Screen coords for menu fixed position
                y: e.clientY,
                type: 'widget',
                targetId: hitShape.id
            });
        } else {
            // Scenario B: Empty Space Clicked
            setMenuState({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                type: 'global'
            });
        }
    }, [containerRef, chartWidgetRef]);

    // Attach listener
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('contextmenu', handleContextMenu);
        return () => container.removeEventListener('contextmenu', handleContextMenu);
    }, [handleContextMenu, containerRef]);

    const closeMenu = () => setMenuState(prev => ({ ...prev, visible: false }));

    const openSettings = () => {
        if (menuState.type === 'widget' && menuState.targetId && chartWidgetRef.current) {
            const shape = chartWidgetRef.current.getShapeById(menuState.targetId);
            if (shape) {
                const primitive = shape.getPrimitive();
                // Check if primitive supports getSettingsSchema
                if (primitive && typeof (primitive as any).getSettingsSchema === 'function') {
                    const schema = (primitive as any).getSettingsSchema();
                    setSettingsState({
                        isOpen: true,
                        schema,
                        targetShape: shape
                    });
                }
            }
        }
        closeMenu();
    };

    const handleDelete = () => {
        if (menuState.type === 'widget' && menuState.targetId && chartWidgetRef.current) {
            chartWidgetRef.current.removeEntity(menuState.targetId);
        }
        closeMenu();
    };

    const handleRemoveAll = () => {
        if (chartWidgetRef.current) {
            chartWidgetRef.current.removeAllShapes();
        }
        closeMenu();
    };

    const closeSettings = () => setSettingsState(prev => ({ ...prev, isOpen: false }));

    const saveSettings = (newSettings: any) => {
        if (settingsState.targetShape) {
            const primitive = settingsState.targetShape.getPrimitive();
            if (primitive && typeof (primitive as any).applySettings === 'function') {
                (primitive as any).applySettings(newSettings);
            }
        }
    };

    return {
        menuState,
        settingsState,
        closeMenu,
        openSettings,
        handleDelete,
        handleRemoveAll,
        closeSettings,
        saveSettings
    };
};
