# Backend API Specification (market-data-core)

**Version:** 1.0 (Audit & Definition)
**Date:** 2026-01-20
**Scope:** Northbound (Frontend <-> Backend) & Southbound (Backend <-> MQL5 Bot)

---

## 1. Southbound API (Backend <-> MQL5 Bot)
**Transport:** Named Pipes (Windows)
**Encoding:** JSON (Newline Delimited)

### 1.1 Connection Architecture
- **Discovery Pipe:** `\\\\.\\pipe\\MT5_Core_Commands` (Listen Only)
  - Bot sends `REGISTER` on startup.
- **Private Command Pipe:** `\\\\.\\pipe\\MT5_Core_Command_{BotID}` (Push)
  - Backend sends commands to Bot.
- **Private Tick Pipe:** `\\\\.\\pipe\\MT5_Node_Ticks_{BotID}` (Stream)
  - Bot pushes `TICK_DATA` or `TICKS_BATCH`.
- **History Pipe:** `\\\\.\\pipe\\MT5_Core_History` (Shared)
  - Bot pushes `HISTORY_DATA` responses.

### 1.2 Commands to Bot (Backend -> Bot)

| Command Type | Payload | Description |
| :--- | :--- | :--- |
| `CMD_SUBSCRIBE_TICKS` | `{ symbols: [{ symbol, timeframe }, ...] }` | Updates the list of symbols the Bot should stream ticks for. |
| `CMD_FETCH_HISTORY` | `{ symbol, timeframe, count, fromTime?, anchorTime? }` | Requests history bars. Supports `fromTime` (Forward Sync) and `anchorTime` (Deep/Back Sync). |
| `CMD_BULK_SYNC` | `{ items: [{ s: symbol, tfs: {...} }] }` | Scheduled bulk check for multiple symbols. |
| `CMD_GET_SYMBOLS` | `{}` | Requests `SYMBOLS_LIST` or `BROKER_SYMBOLS_LIST` from Bot. |

**Observation:** There is **NO explicit priority field** in the commands sent to the Bot. The Backend controls priority effectively by *ordering* when it writes these commands to the pipe.

### 1.3 Messages from Bot (Bot -> Backend)

| Message Type | Payload | Description |
| :--- | :--- | :--- |
| `TICK_DATA` | `{ t, b, a, v }` | Live tick. Logic converts this to 1s Bars if needed. |
| `TICKS_BATCH` | `[ ...tick_items ]` | Efficient batch of ticks/bars. |
| `HISTORY_DATA` | `{ candles: [...] }` | Requested history chunk. |
| `HISTORY_BULK_RESPONSE`| `{ updates: [...] }` | Response to `CMD_BULK_SYNC` for multiple symbols. |
| `SYMBOLS_LIST` | `[ "EURUSD", ... ]` or Objects | List of available instruments. |
| `STATUS_HEARTBEAT` | `{ expert: { active: true } }` | Keep-alive. |
| `REGISTER` | `{ botId, timezone }` | Registration handshake. |

---

## 2. Northbound API (Frontend <-> Backend)
**Transport:** Socket.IO & HTTP REST
**Encoding:** JSON

### 2.1 Socket Events (Frontend -> Backend)

| Event | Params | Description |
| :--- | :--- | :--- |
| `subscribe` | `{ symbol, timeframe }` | Subscribes to realtime updates. **Triggers Blocking Sync (`ensureFreshHistory`).** |
| `unsubscribe` | `symbol` (String) | Leaves the room. Note: Implementation seems to use `socket.leave(symbol)`. |
| `config_update` | `[{ symbol, botId, enabled... }]` | Updates `selected_symbols` configuration. |
| `get_all_symbols` | `None` | Requests `all_symbols_list`. |

### 2.2 Socket Events (Backend -> Frontend)

| Event | Payload | Description |
| :--- | :--- | :--- |
| `initial_data` | `{ history: [], hot: {} }` | Snapshot sent immediately after subscription. |
| `bar_update` | `{ time, open, high, low, close... }` | Realtime bar update (incomplete candle). |
| `history_update`| `{ candles: [] }` | Pushed when a history chunk (Backfill) is ingested. |
| `tick` | `{ bid, ask, time }` | Synthetic tick derived from bar updates (for UI price/Ask/Bid labels). |
| `sync_status` | `{ status: "SYNCING"\|"READY" }` | Sync state updates. |

### 2.3 HTTP Endpoints

| Method | Endpoint | Params | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/history` | `symbol`, `timeframe`, `limit` | Returns latest N bars. **SPOF:** logic calls `ensureFreshHistory` which may block. |
| `GET` | `/symbols` | | Returns detailed symbol list with metadata. |

### 2.4 Identified Gaps (Audit Findings)

1.  **Missing Pagination (Infinite Scroll):**
    - The `/history` endpoint and `db.getHistory` **do not support** `from` / `to` parameters.
    - Frontend cannot request "Data older than timestamp X". It can only request "Latest N bars".
    - **Impact:** Infinite scroll implementation is impossible with current API.

2.  **Missing Priority Control:**
    - Frontend cannot signal "Urgent" vs "Lazy" load.
    - All `subscribe` calls trigger `ensureFreshHistory`, which is treated as `FAST` (High Priority).

---

## 3. Internal Orchestration (SyncManager)

### 3.1 Queue Architecture
- **Priority Queue:** For high-priority tasks (Priority < 10). Used for User Interactions (`subscribe`, `ensureFreshHistory`).
- **Deep Queue:** For background tasks (Priority >= 10). Used for Auto-Backfill (`triggerBackgroundSync`).
- **Logic:** `processQueue()` drains Priority Queue completely before processing Deep Queue.

### 3.2 Single Points of Failure (SPOF)
1.  **Blocking `ensureFreshHistory`:**
    - Called via `handleSubscribe` and `/history`.
    - Creates a `Promise` mapped in `pendingRequests`.
    - Has a **6-second timeout**. If Bot doesn't reply, the Frontend request hangs for 6s.
    - **Recommendation:** Implement "Return Cached Immediately + Async Backfill" pattern (Stale-While-Revalidate).

2.  **Implicit Backfill Only:**
    - Backfill is only triggered implicitly when `ingestHistory` sees a gap or insufficient count.
    - It uses `CMD_FETCH_HISTORY` with `anchorTime`.
    - There is no direct way for Frontend to trigger this explicitly for specific ranges.

---

## 4. Recommendations for "API v2"

1.  **Add Pagination to Northbound:**
    - Update `socket.emit('get_history', { from: timestamp })`.
    - Update `GET /history?to=timestamp`.
    - Update `DatabaseService.getHistory` to support `WHERE time < ?` clause.

2.  **Explicit Priority:**
    - Add `priority` field to `subscribe` or history requests to allow "Lazy Loading" of background tabs.

3.  **Non-Blocking Subscription:**
    - `handleSubscribe` should return DB data immediately (even if stale) and trigger an async sync task.
    - Emit `sync_status: STALE` if data is old.
