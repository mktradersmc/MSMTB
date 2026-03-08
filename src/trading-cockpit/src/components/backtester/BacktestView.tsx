import React from 'react';
import { useBacktest } from '../../contexts/BacktestContext';
import { BacktestDashboard } from './BacktestDashboard';
import BacktestChartPage from './BacktestChartPage';

export const BacktestView: React.FC = () => {
    const { activeSession } = useBacktest();

    if (!activeSession) {
        return (
            <div className="h-full w-full animate-in fade-in zoom-in-95 duration-300 overflow-hidden bg-slate-50 dark:bg-slate-950">
                <BacktestDashboard />
            </div>
        );
    }

    return (
        <div className="h-full w-full animate-in fade-in zoom-in-95 duration-300">
            <BacktestChartPage />
        </div>
    );
};
