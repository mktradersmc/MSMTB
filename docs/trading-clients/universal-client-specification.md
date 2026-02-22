# Universal Trading Client (UTC) - Functional Specification

> **Version:** 1.0  
> **Type:** System Architecture / Functional Spec  
> **Status:** Draft  
> **Scope:** Multi-Platform (MT5, cTrader, NinjaTrader)

## 1. Introduction

The Universal Trading Client (UTC) is a lightweight, execution-focused agent designed to interface with the Trading Cockpit. Unlike the "Datafeed Client" which streams market data, the UTC's sole responsibility is **Trade Execution** and **Account Protection**.

This specification defines the functional requirements, protocols, and behaviors required to implement a UTC on any trading platform (MT5, cTrader, NinjaTrader, etc.).

### 1.1 Core Principles
1.  **Passive Execution:** The client does not generate signals. It executes commands from the Backend.
2.  **Local Guardianship:** The client MUST enforce "Account Health" rules (Daily Loss Limit) locally, as a failsafe against backend errors.
3.  **Thin Client:** Logic is minimized. Complex calculations (e.g., Signal Generation) happen in the backend. However, **Price Resolution** (Anchors) happens in the client to ensure precision.

---

## 2. Connectivity & Identity

### 2.1 Identity (Handshake)
Every client instance acts as a distinct "Bot".
-   **BotID**: A unique string (e.g., `MT5_Live_Alpha`, `cTrader_Demo`).
-   **Role**: `EXECUTION`.

### 2.2 Communication Protocol
The client MUST communicate via **named pipes** (Windows IPC) to ensure ultra-low latency (<1ms).

#### Pipe Configuration
-   **Mechanism**: Named Pipes.
-   **Pipe Name**: `\\.\pipe\{BotID}_Commands` (Input) and `\\.\pipe\{BotID}_Responses` (Output).
-   **Format**: JSON-Line delimited.
-   **Requirement**: Client must reside on the same machine as the Cockpit Relay (or exposed via Network Pipe).

---

## 3. Configuration Parameters

The client must expose the following parameters to the user (via local settings file or platform inputs).

### 3.1 Connectivity Settings
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `BotID` | `String` | Yes | Unique ID for the Cockpit to target this client (e.g. `MT5_Live`). |

### 3.2 Account Guardianship (Local Failsafe)
*These rules must be checked BEFORE every trade execution.*

| Parameter | Type | Default | Behavior |
| :--- | :--- | :--- | :--- |
| `DailyLossProtection` | `Bool` | `False` | If `True`, block trades when `DailyEquityDrop > MaxDrop`. |
| `MaxDailyLoss %` | `Double` | `2.0` | Threshold for stopping trading. |
| `ProfitTarget` | `Enum` | `None` | `None`, `Daily %`, or `Absolute`. |
| `ProfitTargetValue` | `Double` | `0` | Target to stop trading (lock profits). |
| `BasicAccountSize` | `Double` | `100000` | Reference balance for % calculations (optional, can use actual). |

### 3.3 Risk & Execution Defaults
*Fallback values if specific commands do not provide them.*

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `DefaultRisk %` | `Double` | `1.0` | Risk per trade if not specified. |
| `MaxSlippage` | `Integer` | `3` | Max allowed slippage in points. |
| `MaxLotSize` | `Double` | `100` | Hard cap on volume. |
| `IncludeCommissions` | `Bool` | `False` | Deduct estimated commissions from Lot calculation? |

---

## 4. Command Protocol (Input)

The client listens for JSON commands.

### 4.1 EXECUTE_TRADE
Places a new trade. Supports "Dynamic Anchors" (resolving price relative to chart High/Low).

**Payload:**
```json
{
  "type": "EXECUTE_TRADE",
  "content": {
    "id": "uuid-1234",          // Correlation ID (Must be returned in Report)
    "symbol": "EURUSD",
    "direction": "LONG",        // "LONG" or "SHORT"
    "risk": 1.5,                // (Optional) Specific Risk %
    
    // Entry Definition
    "entry": { 
        "type": "MARKET",       // "MARKET", "LIMIT", "STOP"
        "price": 1.0500,        // (Optional) Explicit Price
        "anchor": {             // (Optional) Dynamic Logic
            "type": "PreviousHigh", 
            "timeframe": "M15",
            "offset": 5         // Points relative to anchor
        }
    },
    
    // Stop Loss Definition
    "sl": { 
        "anchor": { "type": "SwingLow", "timeframe": "H1" } 
    },
    
    // Take Profit Definition
    "tp": { 
        "riskReward": 3.0       // Calculate relative to SL distance
    }
  }
}
```

#### Execution Logic
1.  **Guard Check**: Is `DailyLoss` reached? If yes -> `REJECT`.
2.  **Anchor Resolution**: Convert all `anchor` objects to absolute Prices (e.g., `M15 High`).
3.  **Volume Calculation**: 
    `Lots = (AccountBalance * Risk%) / (Distance(Entry, SL) * TickValue)`
4.  **Order Placement**: Send to Broker.

### 4.2 UPDATE_CONFIG (Dynamic Reconfiguration)
Updates runtime parameters without restart.

**Payload:**
```json
{
  "type": "CMD_UPDATE_CONFIG",
  "config": {
    "account": { "maxDailyLoss": 5.0 },
    "risk": { "defaultRisk": 2.0 }
  }
}
```

---

## 5. Reporting Protocol (Output)

The client sends telemetry back to the backend.

### 5.1 TRADE_REPORT
Sent immediately after a trade execution (Success/Failure).

**Payload:**
```json
{
  "type": "TRADE_REPORT",
  "id": "uuid-1234",          // Correlation ID from Command
  "botId": "MT5_Live_Alpha",
  "status": "OPEN",           // "OPEN", "REJECTED", "ERROR"
  "ticket": 12345678,         // Broker Ticket ID
  "symbol": "EURUSD",
  "entryPrice": 1.0500,
  "lots": 1.2,
  "error": "Market Closed"    // Optional error message
}
```

### 5.2 STATUS_UPDATE (Heartbeat & Balance)
Sent periodically (e.g., every 1s) to sync account state.

**Payload:**
```json
{
  "type": "STATUS_UPDATE",
  "botId": "MT5_Live_Alpha",
  "balance": 10500.00,
  "equity": 10450.00,
  "openPositions": 2,
  "dailyProfit": -50.00
}
```
