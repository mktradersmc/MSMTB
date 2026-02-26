import { useState, useEffect, useMemo, useRef } from 'react';
import { fetchDirect } from '../lib/client-api';

export interface TradePosition {
    ticket: number;
    symbol: string;
    type: number; // 0=Buy, 1=Sell
    vol: number;
    open: number;
    current: number;
    sl: number;
    tp: number;
    profit: number;
    realizedPl?: number; // Added for separate tracking
    swap: number;
    commission: number;
    comment: string;
    magic?: number; // Added for Magic Number Tracking
    botId: string;
    brokerId?: string; // Derived
    time?: number; // Broker Open Time
    status?: string;
    customStatus?: string; // Added for robustness
    metrics?: {
        realizedPl?: number;
        historyCommission?: number;
        historySwap?: number;
    };
    runningRr?: number; // Added for Run R Calculation
    // History / UI Compatibility
    id?: string;
    riskPercent?: number; // Parsed from comment
    entryPrice?: number;
    initialEntry?: number; // DB Fixed Original Values
    initialSl?: number;
    initialTp?: number;
    currentPrice?: number;
    errorMessage?: string;
    slAtBe?: boolean; // NEW: Explicit Database Flag
}

export interface AggregatedTrade {
    tradeId: string;
    symbol: string;
    strategy: string;
    direction: 'BUY' | 'SELL';
    totalVol: number;
    volume: number; // Added for compatibility
    size?: number; // Added for compatibility with ChartContainer
    totalProfit: number;
    totalCommission: number;
    totalSwap: number;
    status: 'RUNNING' | 'PARTIAL' | 'CLOSED' | 'OFFLINE' | 'ERROR' | 'REJECTED' | 'PENDING' | 'CREATED' | string;
    positions: TradePosition[];
    // Computed for Group
    avgEntry: number;
    avgSl: number;
    avgTp: number;
    currentRr: number;
    realizedPl: number;
    unrealizedPl: number;
    openTime: number;
    avgPrice: number;
    runningRr: number;
    riskPercent?: number; // NEW: Display in Table
    entryLabel?: string;
    slLabel?: string;
    tpLabel?: string;
    // History Fields
    closeTime?: number;
    exitPrice?: number;
    commission?: number;
    swap?: number;
    errorMessage?: string; // NEW: For displaying ERROR/REJECTED details
    anySlAtBe?: boolean; // NEW: UI Handle Control
    allSlAtBe?: boolean; // NEW: UI Action Button Control
    type?: string;
}

import { socketService } from '../services/socket';
import { useWorkspaceStore } from '../stores/useWorkspaceStore'; // Import Store

export const useTradeMonitor = () => {
    const isTestMode = useWorkspaceStore(state => state.isTestMode); // React to Global Switch

    const [positions, setPositions] = useState<TradePosition[]>([]);
    const [aggregatedTradesState, setAggregatedTradesState] = useState<AggregatedTrade[]>([]);

    // State Refs for merging (to avoid dependency loops) and callbacks
    const aggregatedTradesRef = useRef<AggregatedTrade[]>([]);
    const masterTradesRef = useRef<any[]>([]);
    const livePositionsRef = useRef<TradePosition[]>([]);

    // 1. Slow Poll: Master Trades (Source of Truth for Metadata) - 1s
    const fetchMasterTrades = async () => {
        try {
            const envParam = isTestMode ? 'test' : 'live';
            const tradesRes = await fetchDirect(`/api/active-trades?env=${envParam}`);
            const tradesData = await tradesRes.json();
            const masterTrades = tradesData.success ? tradesData.trades : [];
            masterTradesRef.current = masterTrades;
        } catch (e) {
            console.error("Master Trade Poll Error", e);
        }
    };

    // 2. Fast Poll: Live Positions (Profit/Loss updates) - 50ms
    const fetchLivePositions = async () => {
        try {
            const posRes = await fetchDirect('/api/positions');
            const posData = await posRes.json();
            const livePositions: TradePosition[] = posData.success ? posData.positions : [];

            livePositionsRef.current = livePositions;
            setPositions(livePositions);

            // 3. Merge Logic (Master + Live) -> Aggregated
            // PERFORMED IN-PLACE to ensure 50ms reactivity
            const combined: AggregatedTrade[] = [];
            const claimedTickets = new Set<string>();

            const masterTrades = masterTradesRef.current; // Use latest Ref

            // Process Master Trades first
            masterTrades.forEach((mt: any) => {
                const tId = mt.id.toString();
                // Magic might be in params (if ID is string) or implicit (if ID is numeric)
                const tMagic = (mt.params && mt.params.magic) ? mt.params.magic.toString() : null;

                // Find matching positions (by Magic Number OR Comment)
                const matches = livePositions.filter(p => {
                    // STRICT ID MATCH ONLY (User Mandate)
                    // MQL5 sends position.id which corresponds to the Trade ID
                    return (p as any).id && (p as any).id.toString() === tId;
                });

                matches.forEach(m => claimedTickets.add(`${m.botId}-${m.ticket}`));

                // 4. DB-First Merging Logic (Task-0189 Refactor)
                if (mt.executions && Array.isArray(mt.executions)) {
                    const dbExecutions = mt.executions;
                    const mergedPositions: TradePosition[] = [];
                    const usedLiveIds = new Set<string>();

                    dbExecutions.forEach((exec: any) => {
                        // ROBUSTNESS: Handle both DB (snake_case) and API (camelCase) keys
                        const execBotId = (exec.bot_id || exec.botId || "").trim();

                        // FIX: Search GLOBAL livePositions, not the pre-filtered 'matches'.
                        // 'matches' only contains positions where pos.id == master.id.
                        // But here we want to link via BotID + Ticket/Magic even if ID mismatch.
                        // FIX: Use robust execBotId key
                        // CRITICAL: User Mandate "IMMER DIE TRADE ID nehmen"
                        // Live Position 'id' corresponds to the Master Trade ID (stored as magic_number in DB)
                        const liveMatch = livePositions.find(m =>
                            m.botId === execBotId &&
                            exec.magic_number && m.id == exec.magic_number
                        );

                        if (liveMatch) {
                            usedLiveIds.add(liveMatch.botId);
                            // Parse Broker Name from BotID (e.g. "FTMO_12345" -> "FTMO")
                            const parsedBroker = (execBotId.includes('_'))
                                ? execBotId.split('_')[0]
                                : execBotId;


                            // FIX: Sum History + Current for LIVE matches too. If missing, use DB fallback.
                            const liveComm = liveMatch.commission !== undefined
                                ? liveMatch.commission + ((liveMatch as any).metrics?.historyCommission || 0)
                                : (exec.commission || 0);

                            const liveSwap = liveMatch.swap !== undefined
                                ? liveMatch.swap + ((liveMatch as any).metrics?.historySwap || 0)
                                : (exec.swap || 0);


                            // FIX: Data Persistence - If Live is 0/Missing (e.g. Closed), prefer DB Snapshots
                            // Strictly use Broker Execution Data (Source of Truth). Do NOT fallback to Master (Aggregate).
                            const openPrice = liveMatch.open || exec.entry_price || 0;
                            const slPrice = liveMatch.sl || exec.sl || 0;
                            const tpPrice = liveMatch.tp || exec.tp || 0;

                            // FIX: Prevent 0.00 flickering for current price.
                            // If liveMatch.current is 0, DO NOT drop to 0 if we have entry_price.
                            // Better to freeze at openPrice or last known current than flicker to 0.
                            const currentPrice = liveMatch.current || openPrice;

                            // FIX: Prevent Profit flickering.
                            // MQL5 might report 0 profit in transit for 1 tick.
                            const currentProfit = (liveMatch.profit !== undefined && liveMatch.profit !== null && typeof liveMatch.profit !== 'number' && liveMatch.profit !== 0) ? liveMatch.profit : (liveMatch.profit === 0 ? 0 : (exec.unrealized_pl || 0));


                            // Fix Open Time Overwrite (MQL5 sends CloseTime in 'time' field when closed)
                            // Usage: TradesPanel expects SECONDS for child rows. DB stores MILLISECONDS.
                            const openTimeSeconds = (exec.open_time && exec.open_time > 0)
                                ? (exec.open_time / 1000)
                                : liveMatch.time;

                            mergedPositions.push({
                                ...liveMatch,
                                current: currentPrice, // Override with anti-flicker value
                                profit: currentProfit, // Override with anti-flicker value
                                commission: liveComm,
                                swap: liveSwap,
                                open: openPrice,
                                sl: slPrice,
                                tp: tpPrice,
                                initialEntry: exec.initial_entry !== undefined ? exec.initial_entry : undefined,
                                initialSl: exec.initial_sl !== undefined ? exec.initial_sl : undefined,
                                initialTp: exec.initial_tp !== undefined ? exec.initial_tp : undefined,
                                time: openTimeSeconds,
                                // PREFER: Server Injected Name > Parsed Name > Live > GUID
                                // PREFER: Server Injected Name > Parsed Name > Live > GUID
                                brokerId: exec.brokerName || parsedBroker || liveMatch.brokerId || exec.broker_id,
                                errorMessage: exec.error_message || exec.params?.error, // Map from DB Column or Params
                                // FIX: If we have a live position match, the broker execution is undoubtedly RUNNING.
                                // Don't let a stale PENDING/CREATED DB status hide this fact.
                                status: (exec.status === 'CREATED' || exec.status === 'PENDING') ? 'RUNNING' : (exec.status || 'RUNNING'),
                                realizedPl: (liveMatch as any).metrics?.realizedPl || exec.realized_pl || 0, // FIX: Map from Metrics or DB
                                comment: liveMatch.comment || `[${exec.status}]`,
                                riskPercent: (() => {
                                    const c = liveMatch.comment || "";
                                    const m = c.match(/\|\s*R:(\d+(\.\d+)?)/);
                                    return m ? parseFloat(m[1]) : undefined;
                                })(),
                                runningRr: (() => {
                                    // Calculate Run R for Live Match
                                    const open = liveMatch.open || exec.entry_price || 0;
                                    const sl = liveMatch.sl || exec.sl || 0;
                                    // Live Match has 'current' price from broker
                                    const current = liveMatch.current || open;
                                    const distSl = Math.abs(open - sl);

                                    if (distSl === 0) return 0;
                                    const type = liveMatch.type; // 0=Buy, 1=Sell

                                    // Ensure type check handles string/number mismatch
                                    const isBuy = (type === 0 || (type as any) === '0' || (type as any) === 'BUY');

                                    const distRun = isBuy
                                        ? (current - open)
                                        : (open - current);
                                    return distRun / distSl;
                                })(),
                                slAtBe: exec.sl_at_be === 1 || exec.sl_at_be === true // Map from DB
                            });
                        } else {
                            // Fallback numeric ID for UI keys if ticket missing
                            const fallbackTicket = -1 * (parseInt((exec.id || '0').replace(/\D/g, '')) || Math.floor(Math.random() * 100000));

                            // Parse Broker Name
                            const parsedBroker = (execBotId.includes('_'))
                                ? execBotId.split('_')[0]
                                : execBotId;

                            mergedPositions.push({
                                botId: execBotId,
                                symbol: mt.symbol,
                                type: mt.direction,
                                vol: exec.volume || 0,
                                realizedPl: exec.realized_pl || 0, // NEW: Map DB Realized PnL
                                // profit: exec.realized_pl || 0, // REMOVED: Duplicate key. Profit usually means Floating.
                                // FIX: Sum History + Current because MQL5 sends them separate
                                commission: (exec.commission || 0) + (exec.metrics?.historyCommission || 0),
                                swap: (exec.swap || 0) + (exec.metrics?.historySwap || 0),
                                current: exec.exit_price || 0,
                                open: exec.entry_price || 0,
                                sl: exec.sl || 0,
                                tp: exec.tp || 0,
                                initialEntry: exec.initial_entry,
                                initialSl: exec.initial_sl,
                                initialTp: exec.initial_tp,
                                profit: exec.unrealized_pl || 0, // Fallback to DB Unrealized for 'profit' field
                                ticket: exec.ticket || fallbackTicket,
                                // Fix: Use Server Injected Name > Parsed Name > GUID
                                brokerId: exec.brokerName || parsedBroker || exec.broker_id || 'PENDING',
                                comment: `[${exec.status}]`,
                                time: (exec.open_time && exec.open_time > 0) ? (exec.open_time / 1000) : 0,
                                errorMessage: exec.error_message || exec.params?.error, // Map from DB Column or Params
                                // FIX: If sl_at_be is set, it implies the trade executed (is RUNNING) even if no live match is temporarily present.
                                status: (exec.sl_at_be && (exec.status === 'CREATED' || exec.status === 'PENDING')) ? 'RUNNING' : (exec.status || 'PENDING'),
                                runningRr: (() => {
                                    // Calculate Run R for DB Fallback
                                    const open = exec.entry_price || 0;
                                    const sl = exec.sl || 0;
                                    // Use exit_price for closed, or fall back to open if 0
                                    const current = exec.exit_price || open;
                                    const distSl = Math.abs(open - sl);

                                    if (distSl === 0) return 0;
                                    const type = mt.direction; // 1=Buy(Need Check), 0=Sell? MT5 is 0=Buy, 1=Sell. 
                                    // Wait, mt.direction is 1 or 0? 
                                    // DB: direction INTEGER. Usually 0=Buy, 1=Sell in our schema? 
                                    // Let's check mt.direction usage above: "mt.direction === 1 ? 'BUY' : 'SELL'" (Line 318)
                                    // So 1 is BUY. 

                                    const distRun = (mt.direction === 1)
                                        ? (current - open)
                                        : (open - current);
                                    return distRun / distSl;
                                })(),
                                slAtBe: exec.sl_at_be === 1 || exec.sl_at_be === true // Map from DB
                            });
                        }
                    });

                    // Add Live Orphans (Safety)
                    matches.forEach(m => {
                        if (!usedLiveIds.has(m.botId)) mergedPositions.push(m);
                    });

                    matches.length = 0;
                    matches.push(...mergedPositions);
                }

                // Calculate Aggregates
                let totalVol = 0;
                let unrealizedPl = 0; // From Live Positions
                let totalComm = 0;
                let totalSwap = 0;
                let avgEntry = 0; // Simple Weighted
                let avgPrice = 0; // Current Market Price
                let calculatedAvgSl = 0;
                let activeSlVol = 0;

                // SL_BE Tracking
                let anySlAtBe = false;
                let activeAccountsCount = 0;
                let slAtBeAccountsCount = 0;

                let aggregatedRealized = 0; // Sum of Broker Realized PnL

                if (matches.length > 0) {
                    matches.forEach(p => {
                        totalVol += Number(p.vol || 0);

                        // Robustness: If match reports CLOSED, its open profit is 0 by definition.
                        const matchProfit = (p.customStatus === 'CLOSED') ? 0 : Number(p.profit || 0);
                        unrealizedPl += matchProfit;

                        // AGGREGATE REALIZED PNL from Matches (Broker Executions)
                        // Priority: Metrics (Live) > Direct Property (DB Fallback)
                        if (p.metrics && p.metrics.realizedPl !== undefined) {
                            aggregatedRealized += Number(p.metrics.realizedPl || 0);
                        } else if (p.realizedPl !== undefined) {
                            aggregatedRealized += Number(p.realizedPl || 0);
                        }

                        totalComm += Number(p.commission || 0);
                        totalSwap += Number(p.swap || 0);
                        avgEntry += (Number(p.open || 0) * Number(p.vol || 0));
                        avgPrice += (Number(p.current || 0) * Number(p.vol || 0));

                        if (p.status === 'RUNNING' || p.status === 'PARTIAL') {
                            activeSlVol += Number(p.vol || 0);
                            calculatedAvgSl += (Number(p.sl || 0) * Number(p.vol || 0));

                            activeAccountsCount++;
                            if (p.slAtBe) {
                                anySlAtBe = true;
                                slAtBeAccountsCount++;
                            }
                        }
                    });
                    avgEntry = totalVol > 0 ? avgEntry / totalVol : 0;
                    avgPrice = totalVol > 0 ? avgPrice / totalVol : 0;

                    // Override Average SL if ANY execution is at Break Even
                    if (anySlAtBe) {
                        calculatedAvgSl = avgEntry;
                    } else {
                        calculatedAvgSl = activeSlVol > 0 ? calculatedAvgSl / activeSlVol : (mt.sl || 0);
                    }
                } else {
                    // Use Master values if no execution yet
                    totalVol = mt.volume || 0;
                    avgEntry = mt.entry_price || 0;
                    avgPrice = mt.entry_price || 0; // Fallback to entry
                    calculatedAvgSl = mt.sl || 0;
                }

                // ... RR Calculations ...
                const masterEntry = mt.entry_price || 0;
                const masterSl = mt.sl || 0;
                const masterTp = mt.tp || 0;

                const distSl = Math.abs(masterEntry - masterSl);
                const distTp = Math.abs(masterTp - masterEntry);

                // Plan R: Based on Initial Master Trade paramters (Fixed)
                let plannedRr = 0;
                if (distSl > 0) plannedRr = distTp / distSl;

                // Run R: Based on Average Entry vs Current Price (Dynamic)
                let runningRr = 0;
                // Use AvgEntry (Weighted) for Running R to reflect actual position
                if (distSl > 0 && avgPrice > 0) {
                    const distRun = mt.direction === 1
                        ? (avgPrice - avgEntry)
                        : (avgEntry - avgPrice);
                    runningRr = distRun / distSl;
                }

                // DB Realized PnL (mt.realized_pl) vs Aggregated
                // FIX: Check 'mt.realizedPl' (CamelCase from Backend) AND 'mt.realized_pl' (SnakeCase Legacy)
                const masterRealized = (mt.realizedPl !== undefined) ? mt.realizedPl : (mt.realized_pl || 0);
                const realizedPl = (matches.length > 0) ? aggregatedRealized : masterRealized;

                // FORCE CLOSED STATE LOGIC
                // If DB says CLOSED, we must zero out Unrealized, even if we had ghost matches
                // (Though strict matching should prevent ghost matches on closed trades)
                const isClosed = mt.status === 'CLOSED' || mt.status === 'REJECTED' || mt.status === 'ERROR' || mt.status === 'CANCELED';
                if (isClosed) {
                    unrealizedPl = 0;
                }

                // Params Extraction (Anchors/Labels)
                let params: any = mt.params;
                if (typeof params === 'string') {
                    try { params = JSON.parse(params); } catch { params = {}; }
                }
                if (!params || typeof params !== 'object') params = {};

                const formatAnchor = (a: any) => {
                    if (!a) return undefined;
                    let timeStr = '';
                    if (a.time) {
                        // Heuristic: seconds vs ms
                        const ms = (typeof a.time === 'number' && a.time < 10000000000) ? a.time * 1000 : a.time;
                        timeStr = new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    }
                    const tf = a.timeframe || a.tf;
                    const typeStr = a.type ? ` ${a.type}` : '';
                    return tf ? `[${tf}] ${timeStr}${typeStr}` : (timeStr + typeStr || a.name || 'Anchor');
                };

                let entryLabel = formatAnchor(params.entry?.anchor);
                if (!entryLabel && mt.entry_price === 0) {
                    entryLabel = 'Market';
                }

                let slLabel = formatAnchor(params.sl?.anchor);
                if (!slLabel && mt.sl === 0) {
                    slLabel = 'Auto';
                }

                let tpLabel = formatAnchor(params.tp?.anchor);
                // Auto TP logic: explicit 0 or params flag
                if (!tpLabel) {
                    if (mt.tp === 0 || (params.tp && (params.tp.method === 'RR' || params.tp.auto))) {
                        tpLabel = 'Auto';
                    }
                }

                let mtDirectionStr = mt.direction === 1 ? 'BUY' : 'SELL';
                if (params?.direction) {
                    mtDirectionStr = (params.direction.toUpperCase() === 'LONG' || params.direction.toUpperCase() === 'BUY') ? 'BUY' : 'SELL';
                }

                combined.push({
                    tradeId: tId,
                    symbol: mt.symbol,
                    strategy: mt.strategy || 'Manual',
                    direction: mtDirectionStr as 'BUY' | 'SELL',
                    type: params?.orderType || (mt as any).type || 'MARKET',
                    totalVol: totalVol,
                    volume: totalVol, // Map totalVol to volume
                    realizedPl: realizedPl,
                    unrealizedPl: unrealizedPl,
                    totalProfit: realizedPl + unrealizedPl,
                    totalCommission: totalComm,
                    totalSwap: totalSwap,
                    // FIX: If there are active positions, ONLY upgrade to RUNNING if at least one is truly running.
                    // A 'CREATED' limit order will have a match but is NOT running yet.
                    status: isClosed ? mt.status : (matches.some(m => m.status === 'RUNNING' || m.status === 'PARTIAL') ? 'RUNNING' : (mt.status === 'CREATED' || mt.status === 'PENDING' ? mt.status : (mt.status || 'PENDING'))),
                    positions: matches,
                    avgEntry: avgEntry,
                    avgSl: calculatedAvgSl, // Use calculated dynamically moving SL 
                    avgTp: masterTp, // Show Master TP
                    currentRr: plannedRr,
                    runningRr: runningRr,
                    avgPrice: avgPrice,
                    openTime: mt.created_at || Date.now(),
                    anySlAtBe: anySlAtBe,
                    allSlAtBe: activeAccountsCount > 0 && slAtBeAccountsCount === activeAccountsCount,
                    riskPercent: (() => {
                        // Use aggregated risk from positions? Or Master Params?
                        // If any position has risk, use it.
                        const p = matches.find(m => m.riskPercent !== undefined);
                        if (p) return p.riskPercent;

                        // Fallback: Check Params for 'risk' or 'riskPercent'
                        if (mt.params && (mt.params.risk || mt.params.riskPercent)) {
                            return parseFloat(mt.params.risk || mt.params.riskPercent);
                        }
                        return undefined;
                    })(),
                    entryLabel: entryLabel,
                    slLabel: slLabel,
                    tpLabel: tpLabel,
                    // NEW: Aggregate Error Message from Parent OR Child
                    errorMessage: (() => {
                        // 1. Parent Error (from DB Params)
                        if (params.error) return params.error;

                        // 2. Child Error (from Matches)
                        // Find first match with an error
                        const errMatch = matches.find(m => m.status === 'ERROR' || m.status === 'REJECTED');
                        if (errMatch) {
                            return `${errMatch.brokerId || 'Broker'}: ${errMatch.errorMessage || errMatch.status}`;
                        }
                        return undefined;
                    })()
                });
            });

            // Process Orphans
            const orphanGroups: Record<string, AggregatedTrade> = {};

            livePositions.forEach(pos => {
                const key = `${pos.botId}-${pos.ticket}`;
                if (claimedTickets.has(key)) return;

                // FIX: Strict Protocol Compliance. ID comes from 'id' field (mapped from Magic in Adapter).
                // "Magic Number" is internal to MT5. External consumers use 'id'.
                // Comment is NOT a source of ID.
                let oId = (pos as any).id ? (pos as any).id.toString() : null;

                if (!oId || oId === '0') {
                    // Fallback ONLY to ticket if no ID provided (Unmanaged/Legacy)
                    oId = `ticket-${pos.ticket}`;
                }

                // Final Safety Cast (TS Lint Fix)
                const finalId: string = oId || `ticket-${pos.ticket}`;

                if (!orphanGroups[finalId]) {
                    orphanGroups[finalId] = {
                        tradeId: finalId,
                        symbol: pos.symbol,
                        strategy: pos.comment?.split('|')[0] || 'Manual',
                        direction: pos.type === 0 ? 'BUY' : 'SELL', // Helper needed for type check
                        type: 'MARKET', // Default for orphans
                        totalVol: 0,
                        volume: 0,
                        realizedPl: 0,
                        unrealizedPl: 0,
                        totalProfit: 0,
                        totalCommission: 0,
                        totalSwap: 0,
                        status: 'RUNNING',
                        positions: [],
                        avgEntry: 0,
                        avgSl: 0,
                        avgTp: 0,
                        currentRr: 0,
                        runningRr: 0,
                        avgPrice: 0,
                        openTime: Date.now(),
                        errorMessage: undefined
                    };
                }

                const g = orphanGroups[finalId];
                g.positions.push(pos);
                g.totalVol += Number(pos.vol || 0);
                g.unrealizedPl += Number(pos.profit || 0);
                g.totalProfit += Number(pos.profit || 0);
                g.totalCommission += Number(pos.commission || 0);
                g.totalSwap += Number(pos.swap || 0);

                // Weighting
                const vol = Number(pos.vol || 0);
                g.avgEntry += (Number(pos.open || 0) * vol);
                g.avgPrice += (Number(pos.current || 0) * vol);
                g.avgSl += (Number(pos.sl || 0) * vol);
                g.avgTp += (Number(pos.tp || 0) * vol);

                if (pos.status === 'ERROR' || pos.status === 'REJECTED') {
                    // If an orphan position is actually a failed execution report
                }
            });

            Object.values(orphanGroups).forEach(g => {
                if (g.totalVol > 0) {
                    g.avgEntry /= g.totalVol;
                    g.avgPrice /= g.totalVol;
                    g.avgSl /= g.totalVol;
                    g.avgTp /= g.totalVol;

                    // Calc RR for Orphans
                    const distSl = Math.abs(g.avgEntry - g.avgSl);
                    if (distSl > 0) {
                        g.currentRr = Math.abs(g.avgTp - g.avgEntry) / distSl;
                        const distRun = g.direction === 'BUY'
                            ? (g.avgPrice - g.avgEntry)
                            : (g.avgEntry - g.avgPrice);
                        g.runningRr = distRun / distSl;
                    }
                }
                combined.push(g);
            });

            setAggregatedTradesState(combined);
            aggregatedTradesRef.current = combined;
        } catch (e) {
            console.error("Monitor Poll Error", e);
        }
    };

    useEffect(() => {
        // Reset State on Env Change
        setPositions([]);
        setAggregatedTradesState([]);
        masterTradesRef.current = [];
        livePositionsRef.current = [];

        // Initial Loads
        fetchMasterTrades().then(() => fetchLivePositions());

        // ULTRA-LOW LATENCY: 50ms Fallback + Socket Push
        const intervalFast = setInterval(fetchLivePositions, 50);
        const intervalSlow = setInterval(fetchMasterTrades, 1000);

        // Push Protocol Listener
        const socket = socketService.getSocket();

        const onSignal = (payload: any) => {
            // OPTIMISTIC DELETION: Instantly drop closed trades from the UI
            if (payload && payload.event === 'closed' && Array.isArray(payload.closedIds)) {
                const closedSet = new Set(payload.closedIds);
                masterTradesRef.current = masterTradesRef.current.filter(t => !closedSet.has(t.id));
                livePositionsRef.current = livePositionsRef.current.filter(p => !closedSet.has(p.id) && !closedSet.has(p.magic?.toString()));

                const filteredAggregated = aggregatedTradesRef.current.filter(g => !closedSet.has(g.tradeId));
                aggregatedTradesRef.current = filteredAggregated;
                setAggregatedTradesState(filteredAggregated);
                console.log(`[TradeMonitor] ⚡ Optimistic Delete: Dropped ${payload.closedIds.length} trades instantly.`);
            }

            // Instant Trigger for BOTH Live and Master Data (Background synchronization)
            fetchLivePositions();
            fetchMasterTrades();
        };

        socket.on('trades_update_signal', onSignal);

        // NEW: Listen for Execution Results to immediately update status
        const onExecution = (payload: any) => {
            if (payload.id && (payload.status === 'ERROR' || payload.status === 'REJECTED')) {
                console.log(`[TradeMonitor] 🚨 Execution Update: ${payload.id} -> ${payload.status}`);
                // Update Master Refs immediately to reflect new status
                const target = masterTradesRef.current.find(t => t.id == payload.id);
                if (target) {
                    target.status = payload.status;
                    // Re-trigger merge
                    fetchLivePositions();
                }
            }
        };
        socket.on('execution_result', onExecution);

        return () => {
            clearInterval(intervalFast);
            clearInterval(intervalSlow);
            socket.off('trades_update_signal', onSignal);
            socket.off('execution_result', onExecution);
        };
    }, [isTestMode]); // Re-run when Environment Switches

    const modifyTrade = async (modification: { action: string, tradeId: string, percent?: number }): Promise<boolean> => {
        // Find relevant accounts for this tradeID using the Ref to avoid stale closures
        const targetTrade = aggregatedTradesRef.current.find(t => t.tradeId === modification.tradeId);
        if (!targetTrade) {
            console.error("Trade not found for modification:", modification.tradeId);
            return false;
        }

        // De-duplicate BotIDs
        const accounts = targetTrade.positions.map(p => ({ botId: p.botId }));

        // USER QUERY 7200: "HÖR MIT DIESER MAGIC NUMBER AUF! WIR BENUTZEEN DIE TRADE ID"
        // Implicitly, the `modification.tradeId` (MasterID) IS the Trade ID.
        // We do NOT attempt to find a mismatched "MQL ID" or "Magic". We send the Master ID.
        // If MQL5 uses a different ID, that logic must be fixed in MQL5 or Mapping, not here.

        console.log(`[modifyTrade] Action: ${modification.action} TradeID: ${modification.tradeId}`);
        console.log(`[modifyTrade] 🚀 Sending POST to /api/trade/modify...`);

        const socket = socketService.getSocket();

        try {
            // If action is CANCEL, we wrap it in a Promise to wait for the websocket confirmation
            if (modification.action === 'CANCEL') {
                return new Promise<boolean>(async (resolve) => {
                    const timeout = setTimeout(() => {
                        socket.off('execution_result', onResult);
                        resolve(false);
                        console.warn(`[modifyTrade] CANCEL Timeout for TradeID: ${modification.tradeId}`);
                    }, 5000); // 5 second timeout

                    const onResult = (result: any) => {
                        // Check if this execution result matches our cancel
                        if (result.masterTradeId === modification.tradeId && result.status === 'CANCELED') {
                            clearTimeout(timeout);
                            socket.off('execution_result', onResult);
                            console.log(`[modifyTrade] CANCEL Confirmed via websocket for TradeID: ${modification.tradeId}`);
                            resolve(true);
                        }
                    };

                    socket.on('execution_result', onResult);

                    const res = await fetchDirect('/api/trade/modify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ modification, accounts })
                    });

                    const body = await res.json();
                    if (!body.success) {
                        clearTimeout(timeout);
                        socket.off('execution_result', onResult);
                        resolve(false);
                    }
                });
            }

            // Normal flow for non-CANCEL actions
            const res = await fetchDirect('/api/trade/modify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    modification,
                    accounts
                })
            });
            console.log(`[modifyTrade] Response Status: ${res.status}`);
            const body = await res.json();
            console.log(`[modifyTrade] Response Body: `, body);
            return body.success === true;
        } catch (e) {
            console.error("[modifyTrade] ❌ Modification Network Error:", e);
            return false;
        }
    };

    return { params: {}, aggregatedTrades: aggregatedTradesState, positions, modifyTrade };
};
