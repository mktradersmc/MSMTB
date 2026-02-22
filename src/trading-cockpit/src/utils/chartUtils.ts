
export type Timeframe = 'M1' | 'M2' | 'M3' | 'M5' | 'M10' | 'M15' | 'M30' | 'H1' | 'H2' | 'H3' | 'H4' | 'H6' | 'H8' | 'H12' | 'D1' | 'W1' | 'MN1';

export const getTimeframeSeconds = (tf: string): number => {
    switch (tf) {
        case 'M1': return 60;
        case 'M2': return 120;
        case 'M3': return 180;
        case 'M5': return 300;
        case 'M10': return 600;
        case 'M15': return 900;
        case 'M30': return 1800;
        case 'H1': return 3600;
        case 'H2': return 7200;
        case 'H3': return 10800;
        case 'H4': return 14400;
        case 'H6': return 21600;
        case 'H8': return 28800;
        case 'H12': return 43200;
        case 'D1': return 86400;
        case 'W1': return 604800;
        case 'MN1': return 2592000;
        default: return 60;
    }
};


export const generatePhantomBars = (lastRealTime: number, basePrice: number, timeframe: string, minCount: number = 200): { time: number, value: number }[] => {
    const interval = getTimeframeSeconds(timeframe);
    const phantoms: { time: number; value: number }[] = [];

    // ROLLBACK & OPTIMIZE:
    // User requested rollback to Phantom Bars for stability.
    // Optimization: Use fixed limit (200) instead of infinite (10000) to prevent "Zoom to 2026" issue.
    const limit = minCount;

    let currentTime = lastRealTime;
    for (let i = 0; i < limit; i++) {
        currentTime += interval;
        phantoms.push({ time: currentTime, value: basePrice });
    }

    return phantoms;
};
