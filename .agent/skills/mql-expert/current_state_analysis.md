# Technical Audit: Current Datafeed Tick Architecture
# DATE: 2026-01-19
# SCOPE: Analysis of Legacy Polling System vs. Target Event-Driven System

================================================================================
1. CURRENT STATE DIAGRAM
================================================================================

[Flow: Legacy Polling]
1. `DatafeedExpert::OnTick()` (Primary Trigger) OR `DatafeedExpert::OnTimer()` (Secondary Trigger)
   |
   +-> calls `m_services.CheckTicks()`
       |
       +-> Loop `m_subscribedSymbols` (Linear Search)
           |
           +-> Parse "SYMBOL:TF"
           |
           +-> [BAR MODE]: `CopyRates(sym, tf, 0, 1)` -> Compare Volume vs LastVolume
           |   |
           |   +-> IF Changed: Construct JSON -> Add to `batchArray`
           |
           +-> [TICK MODE]: `SymbolInfoTick(sym)` -> Compare Time vs LastTime
               |
               +-> IF Changed: Construct JSON -> Add to `batchArray`
       |
       +-> `m_tickClient.SendMessage("TICKS_BATCH")` (Pipe Write)

================================================================================
2. CRITICAL BOTTLENECKS (Latency Audit)
================================================================================

### A. The Polling Trap
- **Mechanism**: The bot relies on `OnTick` (driven by the Chart it runs on) and `OnTimer` (10ms resolution). 
- **Flaw**: If "EURUSD" ticks but the EA is running on "BTCUSD" (which is quiet), the `OnTick` won't fire. The fallback is `OnTimer`, which introduces a minimum 10-15ms delay plus the overhead of the Main-Thread event loop.
- **Impact**: Random jitter between 0ms and 20ms.

### B. Linear Iteration
- **Mechanism**: `for(int i=0; i<total; i++)` inside `CheckTicks`.
- **Flaw**: With 100 symbols, this loop consumes significant CPU time fetching `market_data` for every symbol, mostly determining "No Change".
- **Impact**: O(N) complexity per cycle.

### C. Serialization Overhead
- **Mechanism**: Using `JAson` (CJAVal) to construct full JSON objects for every tick.
- **Flaw**: String manipulation and object allocation in MQL5 is relatively slow compared to raw byte packing.
- **Impact**: GC pressure and string copying latency.

================================================================================
3. REDUNDANCY & INTEGRATION PLAN
================================================================================

### Redundancy Check
| Component | Status in v9.6 | Reason |
|-----------|----------------|--------|
| `m_services.CheckTicks` | **DEPRECATED** | Replaced by `IEventRouter::OnCustomEvent` (Push) |
| `m_subscribedSymbols` | **MIGRATED** | Replaced by HashMap/RefCount in `SubscriptionManager` |
| `CDatafeedClient` | **KEPT** (Modified) | Transport layer is still needed, but logic changes to "Pass-Through" |
| `OnTick/OnTimer` | **CLEANED** | Will no longer drive data streaming. |

### Integration Strategy (The "Bypass" Operation)
We will **inject** the new Event-Driven Logic into `DatafeedExpert` without killing the old Logic immediately.

1. **Step 1**: Implement `ISubscriptionManager` inside `DatafeedServices`.
2. **Step 2**: Mod `DatafeedExpert::OnChartEvent` to catch `EVENT_ID_TICK` (10001).
3. **Step 3**: In `OnChartEvent`, call `DirectEmit(sparam)` which bypasses the `CheckTicks` loop and writes directly to the Pipe.
4. **Step 4**: Disable `CheckTicks` loop for symbols that are "Active on TickSpy".

**Recommendation**: Proceed with v9.6 implementation. The current architecture cannot meet the 5ms target reliably due to its polling nature.
