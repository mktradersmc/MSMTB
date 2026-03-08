import React, { createContext, useContext, useState, useEffect } from 'react';
import { getBaseUrl } from '../lib/client-api';

interface BacktestSession {
    id: string;
    name: string;
    main_symbol: string;
    strategy: string;
    start_time: number;
    simulation_time: number;
    initial_balance: number;
    current_balance: number;
    status: string; // 'ACTIVE', 'STOPPED'
    workspace_state?: any;
}

interface BacktestContextProps {
    activeSession: BacktestSession | null;
    startSession: (config: any) => Promise<void>;
    stopSession: () => Promise<void>;
    resumeSession: (id: string) => Promise<void>;
    deleteSession: (id: string) => Promise<void>;
    stepForward: (amountMs: number, symbols: string[]) => Promise<void>;
    refreshSessions: () => Promise<BacktestSession[]>;
}

const BacktestContext = createContext<BacktestContextProps | undefined>(undefined);

export const BacktestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeSession, setActiveSession] = useState<BacktestSession | null>(null);

    // Initial load: maybe restore active session from localStorage if needed, or leave null until explicitly opened
    useEffect(() => {
        const stored = localStorage.getItem('activeBacktestId');
        if (stored) {
            resumeSession(stored).catch(() => localStorage.removeItem('activeBacktestId'));
        }
    }, []);

    const startSession = async (config: any) => {
        try {
            const res = await fetch(`${getBaseUrl()}/api/backtest/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            const data = await res.json();
            if (data.success) {
                setActiveSession(data.session);
                localStorage.setItem('activeBacktestId', data.session.id);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const resumeSession = async (id: string) => {
        try {
            const res = await fetch(`${getBaseUrl()}/api/backtest/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resumeId: id })
            });
            const data = await res.json();
            if (data.success) {
                setActiveSession(data.session);
                localStorage.setItem('activeBacktestId', data.session.id);
            } else {
                throw new Error("Failed to resume session");
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    const stopSession = async () => {
        if (!activeSession) return;
        try {
            await fetch(`${getBaseUrl()}/api/backtest/stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: activeSession.id })
            });
        } catch (e) {
            console.error(e);
        } finally {
            setActiveSession(null);
            localStorage.removeItem('activeBacktestId');
        }
    };

    const deleteSession = async (id: string) => {
        try {
            await fetch(`${getBaseUrl()}/api/backtest/sessions/${id}`, {
                method: 'DELETE'
            });
            // If deleting the active session, clear it locally
            if (activeSession?.id === id) {
                setActiveSession(null);
                localStorage.removeItem('activeBacktestId');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const stepForward = async (amountMs: number, symbols: string[]) => {
        if (!activeSession) return;
        try {
            const res = await fetch(`${getBaseUrl()}/api/backtest/step`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: activeSession.id, amountMs, symbols })
            });
            const data = await res.json();
            if (data.success) {
                setActiveSession(prev => prev ? { ...prev, simulation_time: data.newTime } : prev);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const refreshSessions = async (): Promise<BacktestSession[]> => {
        try {
            const res = await fetch(`${getBaseUrl()}/api/backtest/sessions`);
            const data = await res.json();
            return data.success ? data.sessions : [];
        } catch (e) {
            console.error(e);
            return [];
        }
    };

    return (
        <BacktestContext.Provider value={{
            activeSession,
            startSession,
            stopSession,
            resumeSession,
            deleteSession,
            stepForward,
            refreshSessions
        }}>
            {children}
        </BacktestContext.Provider>
    );
};

export const useBacktest = () => {
    const context = useContext(BacktestContext);
    if (!context) throw new Error('useBacktest must be used within BacktestProvider');
    return context;
};
