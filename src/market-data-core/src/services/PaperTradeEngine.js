const db = require('./DatabaseService');
const { v4: uuidv4 } = require('uuid');

class PaperTradeEngine {
    constructor() { }

    executeTrade(sessionId, tradeConfig) {
        const session = db.getBacktestSession(sessionId);
        if (!session) throw new Error("Backtest Session not found.");

        const id = `bt_trade_${uuidv4()}`;

        // Find current price (from DB cache)
        const history = db.getHistory(tradeConfig.symbol, 'M1', 1, session.simulation_time);
        let entryPrice = 0;
        if (history && history.length > 0) {
            entryPrice = history[history.length - 1].close;
        } else {
            return { success: false, error: "No market data for current simulation time." };
        }

        const trade = {
            id,
            session_id: sessionId,
            symbol: tradeConfig.symbol,
            direction: tradeConfig.direction, // "LONG" or "SHORT" normally string, DB saves 1/0
            status: 'OPEN',
            entry_price: entryPrice,
            sl: tradeConfig.sl || 0,
            tp: tradeConfig.tp || 0,
            volume: tradeConfig.volume || tradeConfig.totalVol || 1, // Fallback
            realized_pl: 0,
            open_time: session.simulation_time,
            close_time: 0
        };

        db.saveBacktestTrade(trade);
        return { success: true, trade };
    }

    modifyTrade(sessionId, modification) {
        const session = db.getBacktestSession(sessionId);
        if (!session) return { success: false, error: 'Session not found' };

        const trades = db.getBacktestTrades(sessionId).filter(t => t.id === modification.tradeId);
        if (trades.length === 0) return { success: false, error: 'Trade not found' };

        const trade = trades[0];

        if (modification.action === 'MODIFY') {
            if (modification.sl !== undefined) trade.sl = modification.sl;
            if (modification.tp !== undefined) trade.tp = modification.tp;
            db.saveBacktestTrade(trade);
            return { success: true, trade };
        } else if (modification.action === 'CLOSE') {
            const percent = modification.percent || 100;
            const history = db.getHistory(trade.symbol, 'M1', 1, session.simulation_time);
            let exitPrice = trade.entry_price;
            if (history && history.length > 0) exitPrice = history[history.length - 1].close;

            const directionMultiplier = trade.direction === 1 ? 1 : -1;

            // Simplistic PnL assuming standard Lots -> Points multiplier based on symbol
            const isForex = trade.symbol.includes('USD') || trade.symbol.includes('EUR') || trade.symbol.includes('GBP');
            const multiplier = isForex ? 100000 : 1;

            const priceDiff = (exitPrice - trade.entry_price) * directionMultiplier;
            const pnl = priceDiff * (trade.volume * multiplier) * (percent / 100);

            const replayEngine = require('./ReplayEngine');
            replayEngine.updateSessionBalance(sessionId, pnl);

            trade.realized_pl += pnl;

            if (percent >= 100) {
                trade.status = 'CLOSED';
                trade.close_time = session.simulation_time;
                trade.exit_price = exitPrice;
            } else {
                trade.volume = trade.volume * (1 - (percent / 100));
            }

            db.saveBacktestTrade(trade);
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

        for (const trade of trades) {
            const candles = updatesBySymbol[trade.symbol];
            if (!candles) continue;

            for (const candle of candles) {
                let hitSL = false;
                let hitTP = false;
                let exitPrice = 0;

                if (trade.direction === 1) { // LONG
                    if (trade.sl > 0 && candle.low <= trade.sl) { hitSL = true; exitPrice = trade.sl; }
                    else if (trade.tp > 0 && candle.high >= trade.tp) { hitTP = true; exitPrice = trade.tp; }
                } else { // SHORT
                    if (trade.sl > 0 && candle.high >= trade.sl) { hitSL = true; exitPrice = trade.sl; }
                    else if (trade.tp > 0 && candle.low <= trade.tp) { hitTP = true; exitPrice = trade.tp; }
                }

                if (hitSL || hitTP) {
                    const directionMultiplier = trade.direction === 1 ? 1 : -1;
                    const isForex = trade.symbol.includes('USD') || trade.symbol.includes('EUR') || trade.symbol.includes('GBP');
                    const multiplier = isForex ? 100000 : 1;

                    const priceDiff = (exitPrice - trade.entry_price) * directionMultiplier;
                    const pnl = priceDiff * (trade.volume * multiplier);

                    trade.status = 'CLOSED';
                    trade.close_time = candle.time;
                    trade.exit_price = exitPrice;
                    trade.realized_pl += pnl;
                    sessionBalanceImpact += pnl;

                    db.saveBacktestTrade(trade);
                    break; // Trade is closed, don't check further ticks for THIS trade
                }
            }
        }

        if (sessionBalanceImpact !== 0) {
            const replayEngine = require('./ReplayEngine');
            replayEngine.updateSessionBalance(sessionId, sessionBalanceImpact);
        }
    }
}

module.exports = new PaperTradeEngine();
