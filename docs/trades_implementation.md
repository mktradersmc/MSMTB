# MSMTB Implementation Documentation - Session Summary (2026-02-05)

## 1. Trade Execution Architecture & Data Flow

### A. The "Main Trade" vs. "Broker Trade" Concept
The system distinguishes between the **User's Intent** (Main Trade) and the **Market Reality** (Broker Trade).

*   **Main Trade (Internal):** Created in the Dashboard. Has a unique `TradeID` (e.g., `173822...`). Stored in `active_trades` DB table. Represents "What I want to do".
*   **Broker Trade (External):** The actual execution on the MT5 account. Has a `Ticket` number. Linked to the Main Trade via `Magic Number` (which equals `TradeID`). Stored in `broker_executions` DB table.

### B. Execution Flow (The "Push" Mechanism)
1.  **Initiation:** User clicks "Execute" in Dashboard.
2.  **Persistence:** `TradeDistributionService.executeBatch()` saves the **Main Trade** to DB (`PENDING`).
3.  **Distribution:** The service splits the trade based on the **Matrix Configuration** (DistributionView).
4.  **Routing:**
    *   Creates **Broker Execution** records for each target bot (`SENT`).
    *   Sends `EXECUTE_TRADE` command to each bot via **Named Pipe** (`\\.\pipe\MT5_Core_Command_[BOTID]`).
    *   *Optimization:* Uses `TradeInfo.mq5` Proxy to avoid blocking the EA.
5.  **Execution (MQL5):**
    *   `TradeInfo` receives JSON -> Writes to File -> Signals EA (Event 1001).
    *   `TradingExpert` picks up file -> Opens Order -> Returns `Ticket`.
6.  **Reporting:**
    *   Bot sends `MSG_POSITIONS_UPDATE` back to Backend via Pipe.

### C. Merging Logic (Where do updates come from?)
Updates flow through a specific pipeline to ensure the GUI shows a unified view.

**1. Backend Aggregation (`TradeWorker.js`)**
*   **Role:** Dedicated Worker Thread to handle high-frequency updates without blocking the main event loop.
*   **Input:** Receives `MSG_POSITIONS_UPDATE` from Bots.
*   **Action:**
    *   Updates `active_trades` status to `FILLED`.
    *   Updates `broker_executions` with PnL, Swap, Commission, and Real Execution Price.
    *   *Throttle:* Limits DB writes to 1s intervals to prevent locking.

**2. Frontend Aggregation (`useTradeMonitor.ts`)**
*   **Role:** "Live Merge" of static DB data and dynamic Bot streams.
*   **Mechanism:**
    *   **Slow Poll (1s):** Fetches `active_trades` (The "Parent" Rows).
    *   **Fast Poll (50ms):** Fetches `positions` (The "Live Stream" from Bots via `SyncManager`).
    *   **Merging:** Iterates Master Trades -> Finds matching Live Positions (by ID/Magic) -> Nests them as `positions` array.
*   **Visuals (`TradesPanel.tsx`):**
    *   **Parent Row:** Shows Aggregated PnL (Sum of children).
    *   **Child Row:** Shows individual Broker Execution (e.g., FTMO vs. Evaluation).

---

## 2. Worker Thread Model
The Backend (`market-data-core`) uses a multi-threaded architecture to separate concerns:

1.  **Main Thread (`server.js` / `SyncManager`):**
    *   Orchestrator. Handles API requests, WebSocket management, and Pipe Server.
    *   *Crucial:* Spawns and manages workers.

2.  **Trade Worker (`TradeWorker.js`):**
    *   **Focus:** execution, PnL tracking, Position Status.
    *   **Isolation:** Ensures heavy DB updates for 100+ trades don't lag the Chart Data stream.

3.  **Symbol Workers (Dynamic):**
    *   **Focus:** Market Data (Ticks/Bars).
    *   **Architecture:** One Worker per Symbol (e.g., `Worker_EURUSD`).
    *   **Task:** Calculates Candles from Ticks (`TickSpy`), serves History queries.

---

## 3. Implementation Changes (This Session)

### A. Redeployment System
**Goal:** Updates `.ex5` files on bots without manual copying.
*   **Frontend:** `DistributionView.tsx` -> "Redeploy TradingExpert" button.
*   **Backend:** `/system/update-bots` endpoint copies `bin/*.ex5` to MT5 AppData.
*   **Status:** Backend Logic restored, Button implemented.

### B. Trade Execution Reliability
**Goal:** Fix "Lost Commands" where `EXECUTE_TRADE` never reached the bot.
*   **Root Cause:** MQL5 `FileReadArray` failed on fragmented Pipe packets (OS buffer splitting large JSONs).
*   **Fix (`TradeInfo.mq5`):** Added `Run-Loop` with `Sleep(10)` to wait for `FileSize == BodyLen`.
*   **Optimization:** Increased `TradingExpert` polling frequency from 100ms to **50ms**.

### C. Synchronization (ACKs)
**Goal:** Stop "Phantom Closed Trades" loop.
*   **Logic:** `SyncManager` now calculates `maxClosedTime` from incoming position reports.
*   **ACK:** Sends `CMD_CONFIRM_HISTORY` to Bot.
*   **Bot:** `TradeInfo` updates local `g_LastHistoryTime` to stop re-sending old closed trades.
*   **Flow:** Bot -> Position(Closed) -> Backend -> DB -> ACK -> Bot (Stop).

---

## 4. Technical Reference

### Compilation
**Command:**
```powershell
& "metaeditor64.exe" /compile:".../TradingExpert.mq5" /include:".../src/mt5/MQL5" /log:"..."
```
*   **Note:** The `/include` flag is mandatory for the project structure.

### File Locations
*   **Frontend Merge:** `src/trading-cockpit/src/hooks/useTradeMonitor.ts`
*   **Frontend UI:** `src/trading-cockpit/src/components/trades/TradesPanel.tsx`
*   **Backend Merge:** `src/market-data-core/src/workers/TradeWorker.js`
*   **Execution Logic:** `src/market-data-core/src/services/TradeDistributionService.js`
*   **MQL5 Pipe:** `src/mt5/MQL5/Indicators/TradeInfo.mq5`

## 5. Next Steps
1.  **Verify Deployment:** Ensure `.ex5` files are physically present in the target MT5 folder.
2.  **Verify Pipes:** Check `\\.\pipe\` existence using `pipelist` or similar if issues persist.
3.  **Test Trade:** Execute a trade from Dashboard -> Check `TradeInfo` Log -> Check `TradesPanel` UI.
