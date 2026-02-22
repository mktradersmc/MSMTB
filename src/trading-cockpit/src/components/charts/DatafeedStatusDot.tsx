"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { communicationHub } from '../../services/CommunicationHub';
import { useBrokerStore } from '../../stores/useBrokerStore';

interface DatafeedStatusDotProps {
    symbol: string;
    botId?: string;
    className?: string;
}

export const DatafeedStatusDot: React.FC<DatafeedStatusDotProps> = ({ symbol, botId, className = "" }) => {
    const [status, setStatus] = useState<'green' | 'red'>('red');
    const [lastTick, setLastTick] = useState<number>(0);
    const { brokers } = useBrokerStore();

    const brokerName = useMemo(() => {
        if (!botId) return "Unknown Broker";
        const broker = brokers.find(b => b.id === botId || b.name === botId);
        return broker ? broker.name : (botId === 'MT5_Bot' ? 'MetaTrader 5' : botId);
    }, [botId, brokers]);

    useEffect(() => {
        // Reset status to RED whenever symbol changes (Chart opened/switched)
        setStatus('red');
        setLastTick(0);

        const handler = (data: any) => {
            if (data && data.symbol === symbol) {
                setLastTick(Date.now());
                setStatus('green');
            }
        };

        // Listen to 'bar_update' (which carries tick/bar data from CommunicationHub)
        communicationHub.on('bar_update', handler);
        return () => communicationHub.off('bar_update', handler);
    }, [symbol]);

    // Check freshness loop
    useEffect(() => {
        // "wenn rot erstmal jede 200 millisekunden. wenn grün, dann auf 5 sekunden senken"
        const intervalMs = status === 'red' ? 200 : 5000;

        const timer = setInterval(() => {
            const now = Date.now();
            // Threshold: 5 seconds without data = Red
            if (now - lastTick > 5000) {
                if (status !== 'red') setStatus('red');
            } else {
                // If we have recent data, ensure we appear green (recovery)
                // Though the handler sets it green immediately.
                if (status !== 'green') setStatus('green');
            }
        }, intervalMs);

        return () => clearInterval(timer);
    }, [status, lastTick]);

    return (
        <div className={`group/dot relative flex items-center justify-center cursor-help ${className}`}>
            <div
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${status === 'green' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.6)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.6)]'}`}
            />

            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 bg-slate-800 border border-slate-700 text-slate-200 text-[10px] rounded opacity-0 group-hover/dot:opacity-100 pointer-events-none whitespace-nowrap z-[100] shadow-xl transition-opacity duration-200">
                Datafeed: <span className="font-bold text-white">{brokerName}</span>
                <div className="text-[9px] text-slate-500 mt-0.5">
                    {status === 'green' ? 'Live Data' : 'No Data'}
                </div>
            </div>
        </div>
    );
};
