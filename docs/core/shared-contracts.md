# Shared Contracts - WebSocket & Data Models

> [!NOTE]
> This document defines the shared understanding between Frontend (Client) and Backend (Adapter/MQL5) regarding data structures and communication protocols.

## Data Subscriptions (WebSocket)

### `subscribe_chart`
Sent by the client to request data for a specific symbol and timeframe.

**Payload:**
```json
{
  "type": "subscribe_chart",
  "botId": "MT5_Bot_12345",
  "symbol": "EURUSD",
  "timeframe": "M1" | "M5" | "H1" | "D1", // Standard MT5 timeframes
  "requestId": "uuid-v4"
}
```

### `unsubscribe_chart`
Sent by the client to stop receiving data.

**Payload:**
```json
{
  "type": "unsubscribe_chart",
  "listenKey": "unique-listen-key-returned-by-ack"
}
```

### `pause_stream`
Sent by the client when a chart is hidden (background tab) to throttle updates.

**Payload:**
```json
{
  "type": "pause_stream",
  "symbol": "EURUSD",
  "timeframe": "M1"
}
```

### `resume_stream`
Sent by the client when a chart becomes visible again.

**Payload:**
```json
{
  "type": "resume_stream",
  "symbol": "EURUSD",
  "timeframe": "M1"
}
```

## Layout Synchronization Contracts

### Timeframe Sync Impact
When `LayoutStateManager` triggers a "Timeframe Sync", all affected charts MUST re-subscribe using the new timeframe.

**Flow:**
1.  **Frontend**: User changes Master Chart to `H1`.
2.  **Frontend**: `LayoutStateManager` detects change and notifies Slave Charts.
3.  **Frontend**: Slave Chart sends `unsubscribe_chart` (for old TF) and `subscribe_chart` (for new `H1` TF).
4.  **Backend**: Must handle rapid subscription overrides if the user scrolls through timeframes quickly (Debouncing recommended on client side).

### Position Sync (Frontend Only)
Position sync (Scroll/Crosshair) is purely a Frontend concern and **DOES NOT** involve backend communication or contract changes. The backend is agnostic to the user's viewport or crosshair position.
