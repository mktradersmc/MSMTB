# MQL5 <-> Node.js JSON Command Protocol Specification

## Overview
This document standardizes the JSON communication protocol between the Node.js Backend (Workers) and MQL5 Clients (Experts/Indicators).
All messages MUST adhere to the **Command Pattern** structure.

**STANDARD CLIENT BEHAVIOR:**
- **REGISTER:** Automatically sent by `WebSocketClient` immediately upon connection/reconnection.
- **HEARTBEAT:** Automatically handled by `WebSocketClient::SendHeartbeat()` (throttled to 1s).

---

## 1. Standard Protocol Envelope

### Request (Node.js -> MQL5)
```json
{
  "header": {
    "command": "COMMAND_NAME",
    "request_id": "req_123", // Correlation ID
    "timestamp": 1700000000,
    "source": "WorkerID"
  },
  "payload": {
    // Command-specific parameters
  }
}
```

### Response (MQL5 -> Node.js)
```json
{
  "header": {
    "command": "COMMAND_NAME_RESPONSE", // or EVENT_NAME
    "request_id": "req_123",            // Matches request
    "status": "OK",                     // OK | ERROR
    "timestamp": 1700000000
  },
  "payload": {
    // Response data
  }
}
```

---

## 2. TradingExpert Protocol

### 2.1 Shared Types: Anchor Object
Parameters like `entry`, `sl`, and `tp` can be either a **double** (raw price) or an **Anchor Object**.

**Anchor Object Structure:**
```json
{
  "timeframe": "H1",      // Timeframe String (M1, H1, etc.)
  "time": 1700000000,     // Bar Time (Broker Timestamp / Unix Seconds)
  "type": "HIGH",         // OPEN | HIGH | LOW | CLOSE
  "price": 1.0500,        // Fallback/Cached Price
  "value": 1.0500         // Alternate key for Price
}
```

### 2.2 Trade Execution (Inbound)
**Command:** `EXECUTE_TRADE`
| Field | Type | Description |
|---|---|---|
| `id` | string | **Trade ID** (Mandatory). Mapped internally to Magic Number. |
| `symbol` | string | Broker Symbol |
| `operation` | string | "BUY" / "SELL" / "BUYLIMIT" / "SELLLIMIT" |
| `volume` | double | Lot size |
| `entry` | double\|Anchor | Entry Price or Anchor Object |
| `sl` | double\|Anchor | Stop Loss Price or Anchor Object |
| `tp` | double\|Anchor | Take Profit Price or Anchor Object |
| `comment` | string | Trade comment |

### 2.3 Modification (Inbound)
**Command:** `CMD_MODIFY_POSITION`
| Field | Type | Description |
|---|---|---|
| `id` | string | **Trade ID**. Identifies Position to modify. |
| `action` | string | "MODIFY" \| "SL_BE" |
| `sl` | double\|Anchor | (For "MODIFY") New Stop Loss |
| `tp` | double\|Anchor | (For "MODIFY") New Take Profit |

**Command:** `CMD_CLOSE_POSITION`
| Field | Type | Description |
|---|---|---|
| `id` | string | **Trade ID**. Identifies Position to close. |
| `action` | string | "CLOSE" \| "CLOSE_PARTIAL" |
| `percent` | double | (For "CLOSE_PARTIAL") 0.0 - 1.0 (e.g. 0.5 = 50%) |

### 2.4 Status Reporting (Outbound)
**Event:** `STATUS_UPDATE`
*Sent every ~200ms by TradingExpert.*
```json
{
  "type": "STATUS_UPDATE",
  "content": {
      "account": {
          "balance": 10000.0,
          "equity": 10050.0,
          "margin": 500.0,
          "free_margin": 9550.0,
          "leverage": 500,
          "dayProfit": 50.0,
          "tradingStopped": false
      },
      "expert": {
          "active": true,
          "allowed": true
      }
  }
}
```

**Event:** `MSG_POSITIONS_UPDATE`
*Sent by TradeInfo on Tick/Trade Event.*
```json
{
  "type": "MSG_POSITIONS_UPDATE",
  "payload": {
      "positions": [
          {
              "id": "123456",             // Trade ID (Matches EXECUTE_TRADE id)
              "ticket": 123456,
              "symbol": "EURUSD",
              "type": "BUY",
              "vol": 1.0,
              "open": 1.0500,
              "current": 1.0510,
              "sl": 1.0400,
              "tp": 1.0600,
              "profit": 100.0,
              "swap": -1.5,
              "commission": -5.0,
              "metrics": {
                  "realizedPl": 100.0,
                  "historyCommission": -5.0,
                  "historySwap": -1.5
              }
          }
      ]
  }
}
```

---

## 3. DatafeedExpert Protocol (Global)
*Role: Global Market Data & Symbol List*

### 3.1 Handshake
**Command:** `REGISTER`
*Payload:* `{ "id": "BotID", "function": "DATAFEED", "symbol": "ALL" }`

### 3.2 Commands
*(To be defined based on specific DatafeedExpert logic, typically Global Ticks or Symbol Config)*

---

## 4. TickSpy Protocol (Chart Specific)
*Role: High-Frequency Tick Data & History for specific Charts*

### 4.1 Handshake
**Command:** `REGISTER`
*Payload:* `{ "id": "BotID", "function": "TICK_SPY", "symbol": "SYMBOL" }`

### 4.2 Inbound Commands
**Command:** `CMD_SUBSCRIBE_TICKS`
| Field | Type | Description |
|---|---|---|
| `timeframe` | string | "M1", "H1", etc. |

**Command:** `CMD_UNSUBSCRIBE_TICKS`
| Field | Type | Description |
|---|---|---|
| `timeframe` | string | "M1", "H1", etc. |

**Command:** `CMD_SYNCHRONIZE_DATA`
| Field | Type | Description |
|---|---|---|
| `timeframe` | string | Timeframe to sync. |
| `lastTime` | int | Last known bar time (Broker Timestamp). Fetches data *since* this time. |

**Command:** `CMD_GET_INITIAL_DATA`
| Field | Type | Description |
|---|---|---|
| `timeframe` | string | Timeframe to fetch. |
| `count` | int | Number of bars to fetch (Snapshot). |

### 4.3 Outbound Events
**Event:** `BAR_DATA`
*Live Tick Data.*
```json
{
  "symbol": "EURUSD",
  "timeframe": "M1",
  "time": 1700000000,
  "open": 1.05,
  "high": 1.051,
  "low": 1.049,
  "close": 1.0505,
  "volume": 12
}
```

**Event:** `HISTORY_SNAPSHOT`
*Response to Sync/Initial Data.*
```json
{
  "type": "HISTORY_SNAPSHOT",
  "data": [ ...Array of Bar Objects... ]
}
```

**Event:** `SYNC_COMPLETE`
*Signal that sync is finished.*

---

## 5. HistoryWorker Protocol

### 5.1 Fetch History (Inbound)
**Command:** `CMD_FETCH_HISTORY`
| Field | Type | Description |
|---|---|---|
| `symbol` | string | Standardized Symbol |
| `timeframe` | string | "M1", "H1", etc. |
| `barTime` | int | **Anchor Time (Broker Timestamp)**. Fetch bars *prior* to this time. |
| `count` | int | Number of bars to fetch backwards. |

### 5.2 History Response (Outbound)
**Event:** `HISTORY_BATCH`
```json
{
  "type": "HISTORY_BATCH",
  "payload": {
    "symbol": "EURUSD",
    "timeframe": "M1",
    "data": [
      { "t": 1700000000, "o": 1.1, "h": 1.2, "l": 1.0, "c": 1.15, "v": 100 },
      ...
    ]
  }
}
```

---

## 6. System
**Command:** `HEARTBEAT` / `HEARTBEAT_ACK`
Used for connection liveliness.
