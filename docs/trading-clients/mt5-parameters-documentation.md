# Universal Trading Client Documentation

This document defines the architecture and parameter set for a **Universal Trading Client** connected to the Trading Cockpit. It abstracts the implementation details found in `TradingExpert` (MQL5) to serve as a blueprint for other platforms (cTrader, NinjaTrader, etc.).

## 1. Core Architecture

A valid client must implement three capabilities:
1.  **Connectivity (AppClient)**: Establish connection with the Backend (HTTP/Pipe) and identify itself via `BotID`.
2.  **Account Guard (AccountManager)**: Protect equity with daily limits and profit targets.
3.  **Execution Engine (TradeManager)**: Execute trades received via JSON commands and enforce risk settings.

---

## 2. Configuration Parameters

The client should expose the following parameters for configuration, either via a settings file (e.g., `bot_properties.txt`) or global inputs.

### 2.1 Connectivity (`AppClient`)
These parameters define *who* the bot is and *how* to talk to the backend.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `BotID` | `string` | Unique Identifier (e.g., `MT5_Live`, `cTrader_Demo`). |
| `API Key` | `string` | Authentication token. |
| `CommunicationMode` | `Enum` | `HTTP` (Long Polling) or `PIPE` (Local IPC). |
| `PollInterval` | `int` | Loop interval in ms (Default `1000`, High-Freq `20`). |
| `ExchangePath` | `string` | Directory for File-based communication (Legacy/Backup). |

### 2.2 Account Guards (`AccountManager`)
These safeguards must run locally on the client to prevent catastrophic loss, independent of backend logic.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `BasicAccountSize` | `double` | `100000` | Reference size for calculating relative drawdown. |
| `DailyLossProtection` | `bool` | `false` | Master switch for daily stopout. |
| `MaxDailyLoss %` | `double` | `2.0` | Max equity drop from day start (%) before blocking new trades. |
| `DailyProfitTarget` | `Enum` | `None` | `None`, `Daily %`, or `Absolute Value`. |
| `ProfitTarget %` | `double` | `1.0` | Target gain in % to stop trading. |

### 2.3 Risk & Execution (`TradeManager`)
Parameters controlling how orders are placed and managed.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `RiskPercentage` | `double` | `1.0` | Default risk per trade if not specified in JSON command. |
| `MaxSlippage` | `int` | `3` | Max deviation in points/pips. |
| `MinLotSize` | `double` | `0.01` | Minimum allowed volume. |
| `MaxLotSize` | `double` | `100` | Maximum allowed volume. |
| `IncludeCommissions` | `bool` | `false` | If true, commission costs are deducted from position size logic. |
| `SecurityBuffer` | `int` | `0` | Extra padding (points) added to StopLoss for safety. |

---

## 3. Trade Execution Protocol

The client must listen for the `EXECUTE_TRADE` command.

### Command Structure (JSON)
```json
{
  "type": "EXECUTE_TRADE",
  "content": {
    "symbol": "EURUSD",
    "direction": "LONG",  // or "SHORT"
    "risk": 1.0,          // (Optional) Override global Risk%
    "id": "trade-uuid",   // Unique ID for tracking
    
    "entry": {
      "type": "MARKET",   // "MARKET", "LIMIT", "STOP"
      "price": 1.0500,    // Explicit price OR
      "anchor": {         // Dynamic Anchor
         "type": "PreviousHigh",
         "timeframe": "M15" 
      }
    },
    
    "sl": {
      "price": 1.0450,    // Explicit price OR
      "anchor": { ... }   // Dynamic Anchor
    },
    
    "tp": {
      "price": 1.0600     // Explicit price OR Anchor
    }
  }
}
```

### Execution Logic
1.  **Validate**: Check `DailyLossProtection`. If triggered, reject trade.
2.  **Resolve**: If `anchor` is provided, resolve it to a price (e.g., High of previous M15 candle). see `AnchorResolver`.
3.  **Calculate**: Determine Volume (Lots) based on `risk`, `sl`, and Account Equity.
4.  **Execute**: Send order to Broker API.
5.  **Report**: Log execution (Ticket #) mapped to `trade-uuid`.

---

## 4. Reporting & Feedback

The client must report active trades back to the backend for synchronization.

**Payload `TRADE_REPORT`**:
```json
{
  "type": "TRADE_REPORT",
  "id": "trade-uuid",     // The ID received in EXECUTE_TRADE
  "botId": "MT5_Live",
  "ticket": 1234567,
  "profit": 50.0,
  "status": "OPEN"        // OPEN, CLOSED
}
```
