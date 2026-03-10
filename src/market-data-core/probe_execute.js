const engine = require('./src/services/PaperTradeEngine');

try {
    const tradeConfig = {
        "symbol": "EURUSD",
        "orderType": "MARKET",
        "direction": "LONG",
        "entry": { "type": "MARKET", "fixed": false, "price": 0, "anchor": null },
        "sl": { "type": "PROTECTION", "fixed": true, "price": 1.16083 },
        "tp": { "type": "TARGET", "fixed": false, "price": 0, "anchor": null },
        "volume": 1,
        "environment": "backtest",
        "backtestId": "bt_1772967399961_39wsha"
    };

    console.log("Calling executeTrade...");
    const result = engine.executeTrade("bt_1772967399961_39wsha", tradeConfig);
    console.log("Result:", result);
} catch (e) {
    console.error("Caught Exception:", e);
}
