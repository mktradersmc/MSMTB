"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";

// --- THEME DEFINITIONS ---

export interface ChartTheme {
    layout: {
        background: { type: string; color: string } | string; // Support legacy string
        textColor: string;
    };
    grid: {
        vertLines: { color: string; visible: boolean; style: number };
        horzLines: { color: string; visible: boolean; style: number };
    };
    candles: {
        upColor: string;
        downColor: string;
        borderUpColor: string;
        borderDownColor: string;
        wickUpColor: string;
        wickDownColor: string;
    };
    crosshair: {
        color: string;
    };
    timeScale: {
        borderColor: string;
    };
    priceScale: {
        borderColor: string;
    };
}

export const DEFAULT_THEME: ChartTheme = {
    layout: {
        background: { type: 'solid', color: '#131722' },
        textColor: '#d1d4dc',
    },
    grid: {
        vertLines: { color: '#1e222d', visible: true, style: 0 },
        horzLines: { color: '#1e222d', visible: true, style: 0 },
    },
    candles: {
        upColor: '#089981',
        downColor: '#f23645',
        borderUpColor: '#089981',
        borderDownColor: '#f23645',
        wickUpColor: '#089981',
        wickDownColor: '#f23645',
    },
    crosshair: {
        color: '#758696',
    },
    timeScale: {
        borderColor: '#2B2B43',
    },
    priceScale: {
        borderColor: '#2B2B43',
    }
};

export const DEFAULT_LIGHT_THEME: ChartTheme = {
    layout: {
        background: { type: 'solid', color: '#ffffff' },
        textColor: '#1e293b', // slate-800
    },
    grid: {
        vertLines: { color: '#e2e8f0', visible: true, style: 0 }, // slate-200
        horzLines: { color: '#e2e8f0', visible: true, style: 0 },
    },
    candles: {
        upColor: '#089981',
        downColor: '#ef4444', // red-500
        borderUpColor: '#089981',
        borderDownColor: '#ef4444',
        wickUpColor: '#089981',
        wickDownColor: '#ef4444',
    },
    crosshair: {
        color: '#94a3b8', // slate-400
    },
    timeScale: {
        borderColor: '#e2e8f0',
    },
    priceScale: {
        borderColor: '#e2e8f0',
    }
};

// --- UTILS ---

/**
 * Deep merges source object into target object.
 * Returns a new object.
 */
function deepMerge(target: any, source: any): any {
    if (typeof target !== 'object' || target === null) {
        return source;
    }

    const output = { ...target };

    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }

    return output;
}

function isObject(item: any) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Migrates legacy theme structures to the current schema.
 */
function migrateTheme(savedCallback: any): ChartTheme {
    let migrated = { ...DEFAULT_THEME };

    // 1. Deep merge saved data onto default to fill missing top-level keys
    // This handles the case where 'crosshair' was missing in saved data
    migrated = deepMerge(migrated, savedCallback);

    // 2. Handle specific migrations (String Grid -> Object Grid)
    if (migrated.grid) {
        // Fix VertLines
        if (typeof migrated.grid.vertLines === 'string') {
            migrated.grid.vertLines = {
                color: migrated.grid.vertLines,
                visible: true,
                style: 0
            };
        }
        // Fix HorzLines
        if (typeof migrated.grid.horzLines === 'string') {
            migrated.grid.horzLines = {
                color: migrated.grid.horzLines,
                visible: true,
                style: 0
            };
        }
    }

    // 3. Fix Layout Background (String -> Object)
    if (migrated.layout && typeof migrated.layout.background === 'string') {
        migrated.layout.background = { type: 'solid', color: migrated.layout.background };
    }

    return migrated;
}


// --- CONTEXT ---

// --- CONTEXT ---

interface ChartThemeContextType {
    theme: ChartTheme;
    mode: 'light' | 'dark'; // Track the mode explicitly
    setMode: (mode: 'light' | 'dark') => void;
    updateTheme: (newTheme: Partial<ChartTheme>) => void;
    resetTheme: () => void;
}

const ChartThemeContext = createContext<ChartThemeContextType | undefined>(undefined);

export const ChartThemeProvider = ({ children }: { children: React.ReactNode }) => {
    // We NO LONGER sync with global theme automatically unless requested.
    // Default to LIGHT as per user request.
    const [mode, setMode] = useState<'light' | 'dark'>('light');
    const [theme, setTheme] = useState<ChartTheme>(DEFAULT_LIGHT_THEME);
    const [mounted, setMounted] = useState(false);

    // Persist Mode
    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem("chart_theme_mode", mode);
        // Apply base theme for the mode
        if (mode === 'light') {
            setTheme(DEFAULT_LIGHT_THEME);
        } else {
            setTheme(DEFAULT_THEME);
        }
    }, [mode, mounted]);

    // Load from LocalStorage on mount
    useEffect(() => {
        setMounted(true);
        // Load Mode
        const savedMode = localStorage.getItem("chart_theme_mode") as 'light' | 'dark';
        if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
            setMode(savedMode);
        } else {
            setMode('light'); // Default to light
        }

        // Load Custom Overrides (optional, if we still want to support custom theme tweaks on top of base)
        const savedTheme = localStorage.getItem("chart_theme");
        if (savedTheme) {
            try {
                const parsed = JSON.parse(savedTheme);
                const validTheme = migrateTheme(parsed);
                // We should probably merge this ON TOP of the base theme for the current mode
                // But for now, let's just respect the mode switch primarily.
                // If specific overrides exist, they might be mode-specific... simplified for now:
                // If user toggles mode, we reset customizations? Or do we keep them?
                // User asked for "Light or Dark", simple. Let's prioritize the Mode.
            } catch (e) {
                console.error("Failed to load theme", e);
            }
        }
    }, []);

    const updateTheme = (newTheme: any) => {
        setTheme(prev => {
            const updated = deepMerge(prev, newTheme);
            localStorage.setItem("chart_theme", JSON.stringify(updated));
            return updated;
        });
    };

    const resetTheme = () => {
        setMode('light');
        setTheme(DEFAULT_LIGHT_THEME);
        localStorage.removeItem("chart_theme");
        localStorage.removeItem("chart_theme_mode");
    };

    return (
        <ChartThemeContext.Provider value={{ theme, mode, setMode, updateTheme, resetTheme }}>
            {children}
        </ChartThemeContext.Provider>
    );
};

export const useChartTheme = () => {
    const context = useContext(ChartThemeContext);
    if (!context) throw new Error("useChartTheme must be used within a ChartThemeProvider");
    return context;
};
