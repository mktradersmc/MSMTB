# Antigravity MQL Backend Architecture
# SCOPE: MT5 Master EA, TickSpy Indicator, WebSocket Bridge

================================================================================
1. HIGH-SPEED STREAMING BRIDGE (Architecture v9.2)
================================================================================
Reference: Event-Driven Architecture for MT5 <-> React Latency Minimization.

## 1.1 Component Definition
The architecture decouples the "Heavy" Master logic from the "Light" Tick capture.

1. **TickSpy (Indicator)**: 
   - **Role**: A lightweight indicator running on **hidden charts**. 
   - **Duty**: Captures `OnCalculate` (Tick arrive), formats the payload, and fires `EventChartCustom` to the Master.
   - **Footprint**: Minimal. No trading logic. Pure signal emitter.

2. **Master-EA (Controller)**:
   - **Role**: The central "Event Bus" and Lifecycle Manager.
   - **Duty**: 
     - Manages "Reference Counting" for subscriptions.
     - Opens/Closes hidden charts as needed.
     - Acts as the `IEventRouter`, receiving Custom Events from TickSpy and piping them to the Bridge.

3. **WebSocket-Bridge**:
   - **Role**: The Transport Layer (DLL or NamedPipe).
   - **Duty**: Pushes raw bytes to the Frontend (React).

## 1.2 The "Handshake & Subscription" Protocol

### State Machine (Symbol Subscription)
1. **FE_REQ_SUB(symbol)**: Frontend requests data for "EURUSD".
2. **BE_ACK**: Backend acknowledges reception.
3. **MASTER_EA_OPEN_CHART**: Master EA checks if "EURUSD" hidden chart exists. If not, opens it.
4. **TICK_SPY_START**: Master EA attaches `TickSpy` indicator to the hidden chart.
5. **STREAMING**: TickSpy begins emitting `OnCalculate` events -> Master EA -> Bridge -> FE.

### Collision Avoidance
- **Global Variables**: `ANTIGRAVITY_SUB_{SYMBOL}` (e.g., `ANTIGRAVITY_SUB_EURUSD`). Value = RefCount.
- **Event IDs & Payloads**: See `../shared-contracts.md`.

## 1.3 High-Speed Event Contract (5ms Target)

### Constraints
- **NO POLLING**: `OnTimer` is forbidden for data checking. `OnCalculate` (Push) is mandatory.
- **Throttling**: 5ms High-Resolution timer logic in MQL5 to debounce "Micro-Ticks" (e.g., bid change 1.00001 -> 1.00001 within 1ms).

## 1.4 Skeleton Definitions (The "Hard API")

```cpp
// --- ISubscriptionManager.mqh ---
interface ISubscriptionManager {
    // Lifecycle
    bool Subscribe(string symbol);
    bool Unsubscribe(string symbol);
    
    // State
    int GetActiveSubscriberCount(string symbol);
    bool IsChartOpen(string symbol);
    
    // Action
    long OpenHiddenChart(string symbol, ENUM_TIMEFRAMES period);
    bool CloseHiddenChart(long chartID);
};

// --- IEventRouter.mqh ---
interface IEventRouter {
    // The core event loop handler
    void OnCustomEvent(int id, long &lparam, double &dparam, string &sparam);
    
    // Transport
    bool EmitToBridge(string payload);
};

// --- ITickSpy.mqh ---
// Abstract Base for the Indicator
class ITickSpy {
public:
    virtual int OnCalculate(const int rates_total,
                            const int prev_calculated,
                            const datetime &time[],
                            const double &open[],
                            const double &high[],
                            const double &low[],
                            const double &close[],
                            const long &tick_volume[],
                            const long &volume[],
                            const int &spread[]) = 0;
                            
protected:
    // Helper to fire event to Master
    bool SendTickEvent(string symbol, double bid, double ask, long time);
};
```
