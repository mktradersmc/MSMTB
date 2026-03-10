const db = require('./DatabaseService');
const { v4: uuidv4 } = require('uuid');

class PaperTradeEngine {
    constructor() { }

    getDigits(symbol) {
        let digits = 5; // Fallback
        try {
            const orchestrator = require('./SystemOrchestrator');
            const confs = orchestrator.configuredSymbols || [];
            const found = confs.find(s => s.symbol === symbol || s.originalName === symbol || s.name === symbol);
            if (found && found.digits !== undefined) {
                digits = found.digits;
            }
        } catch (e) {
            console.error("[PaperTradeEngine] Failed to resolve digits from orchestrator:", e);
        }
        return digits;
    }

    executeTrade(sessionId, tradeConfig, mappedAccounts = []) {
        const session = db.getBacktestSession(sessionId);
        if (!session) throw new Error("Backtest Session not found.");

        const id = `bt_trade_${uuidv4()}`;

        // Find current price (from DB cache)
        // IMPORTANT: simulation_time is the end of the current step.
        // To get the exact price at the moment of execution, we look at the close of the most recently COMPLETED candle
        // or the open of the current one. Using getHistory(..., 1, simulation_time) returns the future completed candle.
        const history = db.getHistory(tradeConfig.symbol, 'M1', 2, session.simulation_time);
        let entryPrice = 0;
        if (history && history.length > 0) {
            // If we fetched 2 candles, the first one is the previously fully closed candle.
            // If we only got 1, we use its Open price as the most realistic execution price for a newly stepped candle.
            entryPrice = history.length > 1 ? history[0].close : history[0].open;
        } else {
            return { success: false, error: "No market data for current simulation time." };
        }

        const slObj = typeof tradeConfig.sl === 'object' ? tradeConfig.sl : {};
        let slPrice = Number(slObj.price || (typeof tradeConfig.sl === 'number' ? tradeConfig.sl : 0));
        if (slPrice === 0 && slObj.anchor && slObj.anchor.price) slPrice = Number(slObj.anchor.price);

        const tpObj = typeof tradeConfig.tp === 'object' ? tradeConfig.tp : {};
        let tpPrice = Number(tpObj.price || (typeof tradeConfig.tp === 'number' ? tradeConfig.tp : 0));
        if (tpPrice === 0 && tpObj.anchor && tpObj.anchor.price) tpPrice = Number(tpObj.anchor.price);

        const tradeDirectionInt = (tradeConfig.direction === 'LONG' || tradeConfig.direction === 1) ? 1 : 0;

        // Auto-Calculate TP if using Risk-Reward
        if (tpPrice === 0 && tradeConfig.riskReward && tradeConfig.riskReward.value > 0 && slPrice > 0) {
            const dist = Math.abs(entryPrice - slPrice);
            const rr = tradeConfig.riskReward.value;
            tpPrice = (tradeDirectionInt === 1) ? (entryPrice + (dist * rr)) : (entryPrice - (dist * rr));
        }

        const digits = this.getDigits(tradeConfig.symbol);

        // Volume is now strictly a percentage (Starts at 100%)
        let calculatedVolume = 100;
        let pointValue = 0;

        if (slPrice > 0) {
            const acc = (mappedAccounts && mappedAccounts.length > 0) ? mappedAccounts[0] : null;
            const riskPercent = acc ? (acc.manualRisk || acc.riskPercent || 1) : 1;
            const balance = acc ? (acc.balance || session.current_balance || session.initial_balance || 100000) : (session.current_balance || 100000);

            const riskAmount = balance * (riskPercent / 100);
            const slDistanceRaw = Math.abs(entryPrice - slPrice); // e.g., 0.0050
            const slDistancePoints = slDistanceRaw * Math.pow(10, digits); // e.g., 50 points

            if (slDistancePoints > 0) {
                // How much exact Dollar value does 1 Point have? (e.g., $1000 risk / 50 points = $20 per Point)
                pointValue = riskAmount / slDistancePoints;
            } else {
                pointValue = 1; // Standard fallback multiplier
            }
        } else {
            pointValue = 1; // Standard fallback multiplier if no SL is provided
        }


        const trade = {
            id,
            session_id: sessionId,
            symbol: tradeConfig.symbol,
            direction: tradeDirectionInt,
            status: 'OPEN',
            entry_price: entryPrice,
            current_price: entryPrice,
            sl: slPrice,
            tp: tpPrice,
            volume: calculatedVolume,
            realized_pl: 0,
            unrealized_pl: 0,
            point_value: pointValue,
            open_time: session.simulation_time,
            close_time: 0
        };

        db.saveBacktestTrade(trade);
        console.log(`[PAPER-ENGINE] EXECUTE: Symbol=${trade.symbol}, Dir=${tradeDirectionInt}, PointVal=${pointValue}, Digits=${digits}`);
        return { success: true, trade };
    }

    modifyTrade(sessionId, modification) {
        console.log(`[PAPER-ENGINE] modifyTrade CALLED | Session: ${sessionId} | Action: ${modification.action} | TradeID: ${modification.tradeId}`);
        const session = db.getBacktestSession(sessionId);
        if (!session) {
            console.error(`[PAPER-ENGINE] modifyTrade FAILED | Session ${sessionId} not found`);
            return { success: false, error: 'Session not found' };
        }

        const trades = db.getBacktestTrades(sessionId).filter(t => t.id === modification.tradeId);
        if (trades.length === 0) {
            console.error(`[PAPER-ENGINE] modifyTrade FAILED | Trade ${modification.tradeId} not found in Session ${sessionId}`);
            return { success: false, error: 'Trade not found' };
        }

        const trade = trades[0];
        const digits = this.getDigits(trade.symbol);

        if (modification.action === 'SL_BE') {
            trade.sl = trade.entry_price;
            db.saveBacktestTrade(trade);

            try {
                const orchestrator = require('./SystemOrchestrator');
                if (orchestrator.socketServer && orchestrator.socketServer.io) {
                    orchestrator.socketServer.io.emit('trades_update_signal', { source: 'backtest_sl_be' });
                }
            } catch (e) { }

            return { success: true, trade };
        } else if (modification.action === 'MODIFY') {
            if (modification.sl !== undefined) {
                trade.sl = Number((typeof modification.sl === 'object') ? modification.sl.price : modification.sl);
            }
            if (modification.tp !== undefined) {
                trade.tp = Number((typeof modification.tp === 'object') ? modification.tp.price : modification.tp);
            }
            db.saveBacktestTrade(trade);

            try {
                const orchestrator = require('./SystemOrchestrator');
                if (orchestrator.socketServer && orchestrator.socketServer.io) {
                    orchestrator.socketServer.io.emit('trades_update_signal', { source: 'backtest_modify' });
                }
            } catch (e) { }

            return { success: true, trade };
        } else if (modification.action === 'CLOSE' || modification.action === 'CLOSE_PARTIAL') {
            const percent = modification.percent || 100;
            const history = db.getHistory(trade.symbol, 'M1', 2, session.simulation_time);
            let exitPrice = trade.entry_price;
            if (history && history.length > 0) {
                exitPrice = history.length > 1 ? history[0].close : history[0].open;
            }

            const directionMultiplier = (trade.direction === 1) ? 1 : -1;

            const priceDiff = (exitPrice - trade.entry_price) * directionMultiplier;
            const priceDiffPoints = priceDiff * Math.pow(10, digits);

            // PnL = Movement * User's Defined Risk per step * Available Volume * Percent Taken
            const currentVolumePercent = trade.volume / 100;
            const closingRatio = percent / 100;
            const pnl = priceDiffPoints * (trade.point_value || 1) * currentVolumePercent * closingRatio;

            console.log(`\n============== PNL DEBUG ==============`);
            console.log(`Action: ${modification.action}, Percent: ${percent}%`);
            console.log(`ExitPrice: ${exitPrice}, EntryPrice: ${trade.entry_price}`);
            console.log(`DirectionMultiplier: ${directionMultiplier}`);
            console.log(`PriceDiffRaw: ${priceDiff}, Digits: ${digits}, PriceDiffPoints: ${priceDiffPoints}`);
            console.log(`Trade Volume: ${trade.volume}, CurrentVol%: ${currentVolumePercent}, ClosingRatio: ${closingRatio}`);
            console.log(`Point Value: ${trade.point_value || 1}`);
            console.log(`-------------`);
            console.log(`Final PnL Evaluated: ${pnl} | isNaN? ${isNaN(pnl)}`);
            console.log(`======================================\n`);

            console.log(`[PAPER-ENGINE] CLOSE: DirMult=${directionMultiplier}, DiffRaw=${priceDiff}, Pts=${priceDiffPoints}, PointVal=${trade.point_value}, Vol%=${currentVolumePercent}, CloseRatio=${closingRatio}, ResultPnL=${pnl}`);

            trade.realized_pl += pnl;

            if (percent >= 100) {
                trade.status = 'CLOSED';
                trade.close_time = session.simulation_time;
                trade.exit_price = exitPrice;
                trade.unrealized_pl = 0; // Clear floating


                // Broadcast immediate drop
                try {
                    const orchestrator = require('./SystemOrchestrator');
                    if (orchestrator.socketServer && orchestrator.socketServer.io) {
                        orchestrator.socketServer.io.emit('trades_update_signal', { event: 'closed', closedIds: [trade.id] });
                        orchestrator.socketServer.io.emit('execution_result', { masterTradeId: trade.id, status: 'CLOSED' });
                    }
                } catch (e) { }
            } else {
                trade.volume = trade.volume * (1 - (percent / 100));
                trade.unrealized_pl = trade.unrealized_pl * (1 - (percent / 100));

                try {
                    const orchestrator = require('./SystemOrchestrator');
                    if (orchestrator.socketServer && orchestrator.socketServer.io) {
                        orchestrator.socketServer.io.emit('trades_update_signal', { event: 'partial_closed', tradeId: trade.id });
                    }
                } catch (e) { }
            }

            db.saveBacktestTrade(trade);

            const replayEngine = require('./ReplayEngine');
            // DB computes sum via ReplayEngine, but trade must be saved FIRST!
            replayEngine.updateSessionBalance(sessionId);

            return { success: true, trade };
        }
        return { success: false, error: 'Unknown Action' };
    }

    // Called automatically by ReplayEngine to simulate price sweeping limits
    processSimulationStep(sessionId, updatesBySymbol) {
        const session = db.getBacktestSession(sessionId);
        if (!session) return;

        const trades = db.getBacktestTrades(sessionId).filter(t => t.status === 'OPEN');
        if (trades.length === 0) return;

        let sessionBalanceImpact = 0;
        let closedIds = [];

        for (const trade of trades) {
            const candles = updatesBySymbol[trade.symbol];
            if (!candles) continue;

            const digits = this.getDigits(trade.symbol);

            for (const candle of candles) {
                let hitSL = false;
                let hitTP = false;
                let exitPrice = 0;

                if (trade.direction === 1) { // LONG
                    if (trade.sl > 0 && candle.low <= trade.sl) { hitSL = true; exitPrice = trade.sl; }
                    if (trade.tp > 0 && candle.high >= trade.tp) { hitTP = true; exitPrice = trade.tp; }
                } else { // SHORT
                    if (trade.sl > 0 && candle.high >= trade.sl) { hitSL = true; exitPrice = trade.sl; }
                    if (trade.tp > 0 && candle.low <= trade.tp) { hitTP = true; exitPrice = trade.tp; }
                }

                // If both hit in the same M1 candle, be conservative: assume SL hit first.
                if (hitSL && hitTP) {
                    hitTP = false;
                    exitPrice = trade.sl;
                }

                const directionMultiplier = (trade.direction === 1) ? 1 : -1;

                if (hitSL || hitTP) {
                    // Strict Break-Even check to prevent float precision bleeding into PnL
                    if (hitSL && trade.sl === trade.entry_price) {
                        exitPrice = trade.entry_price;
                    }

                    const priceDiffRaw = (exitPrice - trade.entry_price) * directionMultiplier;
                    const priceDiffPoints = priceDiffRaw * Math.pow(10, digits);
                    const pnl = priceDiffPoints * (trade.point_value || 1) * (trade.volume / 100);

                    trade.status = 'CLOSED';
                    trade.close_time = candle.time;
                    trade.exit_price = exitPrice;
                    trade.realized_pl += pnl;
                    trade.unrealized_pl = 0; // Clear floating
                    sessionBalanceImpact += pnl;

                    closedIds.push(trade.id);

                    db.saveBacktestTrade(trade);

                    console.log(`[PAPER-ENGINE] SL/TP HIT: ${trade.symbol} DirMult=${directionMultiplier}, DiffRaw=${priceDiffRaw}, Pts=${priceDiffPoints}, PtVal=${trade.point_value}, Vol%=${trade.volume / 100}, PnL=${pnl}`);
                    break; // Trade is closed, don't check further ticks for THIS trade
                } else {
                    // Calculate Unrealized PnL on every tick (using Close price for simplicity)
                    const floatingDiffRaw = (candle.close - trade.entry_price) * directionMultiplier;
                    const floatingDiffPoints = floatingDiffRaw * Math.pow(10, digits);
                    const newUnrealized = floatingDiffPoints * (trade.point_value || 1) * (trade.volume / 100);

                    if (Math.abs(trade.unrealized_pl - newUnrealized) > 1) {
                        console.log(`[PAPER-ENGINE] TICK: ${trade.symbol} DirMult=${directionMultiplier}, DiffRaw=${floatingDiffRaw}, Pts=${floatingDiffPoints}, PtVal=${trade.point_value}, Vol%=${trade.volume / 100}, Unrealized=${newUnrealized}`);
                    }

                    trade.unrealized_pl = newUnrealized;
                    trade.current_price = candle.close;
                    db.saveBacktestTrade(trade);
                }
            }
        }

        if (sessionBalanceImpact !== 0 || closedIds.length > 0) {
            const replayEngine = require('./ReplayEngine');

            // ReplayEngine now forces an absolute sum recalculation instead of using deltas
            replayEngine.updateSessionBalance(sessionId);
        }

        if (closedIds.length > 0) {
            try {
                const orchestrator = require('./SystemOrchestrator');
                if (orchestrator.socketServer && orchestrator.socketServer.io) {
                    orchestrator.socketServer.io.emit('trades_update_signal', { event: 'closed', closedIds });
                }
            } catch (e) { }
        }
    }
}

module.exports = new PaperTradeEngine();