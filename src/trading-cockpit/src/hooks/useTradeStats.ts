import { useState, useEffect } from 'react';
import { fetchDirect } from '../lib/client-api';

export interface LiveTradeHistory {
    id: string;
    symbol: string;
    direction: 'LONG' | 'SHORT';
    status: string;
    entry_price: number;
    exit_price: number;
    volume: number;
    profit: number;
    open_time: number;
    close_time: number;
    strategy: string;
}

export interface TradeStats {
    totalTrades: number;
    monetaryPnL: number;
    winrate: number;
    avgWin: number;
    avgLoss: number;
    wins: number;
    losses: number;
}

export interface DailyStats {
    date: Date;
    monetaryPnL: number;
    wins: number;
    losses: number;
    isCurrentMonth: boolean;
}

export const useTradeStats = (calendarDate: Date = new Date()) => {
    const [trades, setTrades] = useState<LiveTradeHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const loadHistory = async () => {
            setIsLoading(true);
            try {
                // Fetch up to 5000 trades to ensure we cover the month
                const res = await fetchDirect('/trade-history?limit=5000');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.history) {
                        if (isMounted) setTrades(data.history);
                    }
                }
            } catch (e) {
                console.error("Failed to load trade history", e);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadHistory();
        return () => { isMounted = false; };
    }, []);

    // Time boundaries
    const now = new Date();

    // Start of THIS week (Sunday)
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);

    // Start of LAST week (Sunday)
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

    // End of LAST week (Saturday 23:59:59)
    const endOfLastWeek = new Date(startOfThisWeek);
    endOfLastWeek.setMilliseconds(-1);

    const filterTrades = (start: Date | null, end: Date | null) => {
        return trades.filter(t => {
            const date = new Date(t.close_time || t.open_time); // Use close_time for realized PnL date
            if (start && date < start) return false;
            if (end && date > end) return false;
            return true;
        });
    };

    const calcStats = (txs: LiveTradeHistory[]): TradeStats => {
        if (txs.length === 0) {
            return { totalTrades: 0, monetaryPnL: 0, winrate: 0, avgWin: 0, avgLoss: 0, wins: 0, losses: 0 };
        }

        let wins = 0;
        let losses = 0;
        let totalWin = 0;
        let totalLoss = 0;

        txs.forEach(t => {
            const pnl = t.profit || 0;
            if (pnl > 0) {
                wins++;
                totalWin += pnl;
            } else if (pnl < 0) {
                losses++;
                totalLoss += Math.abs(pnl);
            }
        });

        const totalTrades = wins + losses;

        return {
            totalTrades: txs.length,
            monetaryPnL: totalWin - totalLoss,
            winrate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
            avgWin: wins > 0 ? (totalWin / wins) : 0,
            avgLoss: losses > 0 ? (totalLoss / losses) : 0,
            wins,
            losses
        };
    };

    const overallStats = calcStats(trades);
    const thisWeekStats = calcStats(filterTrades(startOfThisWeek, null));
    const lastWeekStats = calcStats(filterTrades(startOfLastWeek, endOfLastWeek));

    // Calendar generation for SELECTED MONTH
    const startOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
    const endOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);

    // To make a proper calendar grid, we need to find the previous Sunday of the start of the month
    const startOfCalendar = new Date(startOfMonth);
    startOfCalendar.setDate(startOfMonth.getDate() - startOfMonth.getDay());

    // End of calendar is the Saturday after the end of the month
    const endOfCalendar = new Date(endOfMonth);
    if (endOfMonth.getDay() !== 6) {
        endOfCalendar.setDate(endOfMonth.getDate() + (6 - endOfMonth.getDay()));
    }

    const calendarDays: DailyStats[][] = [];
    let currentWeek: DailyStats[] = [];

    let loopDate = new Date(startOfCalendar);
    while (loopDate <= endOfCalendar) {
        const nextDay = new Date(loopDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const dayTrades = filterTrades(loopDate, new Date(nextDay.getTime() - 1));
        const dayStats = calcStats(dayTrades);

        currentWeek.push({
            date: new Date(loopDate),
            monetaryPnL: dayStats.monetaryPnL,
            wins: dayStats.wins,
            losses: dayStats.losses,
            isCurrentMonth: loopDate.getMonth() === calendarDate.getMonth()
        });

        if (currentWeek.length === 7) {
            calendarDays.push(currentWeek);
            currentWeek = [];
        }

        loopDate.setDate(loopDate.getDate() + 1);
    }

    return {
        overallStats,
        thisWeekStats,
        lastWeekStats,
        calendarDays,
        isLoading
    };
};
