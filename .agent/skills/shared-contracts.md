# Shared WebSocket & Event Contracts
# SCOPE: WebSocket Message Formats, Event IDs, and Shared Constants.
# ACCESS: Readable by both `frontend-developer` and `mql-expert`.

================================================================================
1. EVENT IDENTIFIERS (Collision Avoidance)
================================================================================
These IDs are used for `EventChartCustom` communication between TickSpy and Master-EA, and extended to the WebSocket Bridge.

- **EVENT_ID_TICK**:  10001
- **EVENT_ID_BAR**:   10002
- **EVENT_ID_ERROR**: 10003

================================================================================
2. HIGH-SPEED DATA PAYLOAD
================================================================================
This format is used for streaming tick data from MQL5 to the Frontend via the Bridge.

## 2.1 String Format (Bit-Packing Optimized)
The payload is a pipe-delimited string to minimize parsing overhead.

**Structure**:
`"{TICK_TYPE}|{SYMBOL}|{PRICE}|{VOLUME}|{TIMESTAMP}"`

**Fields**:
1. **TICK_TYPE**: Integer (Enum: 0=ASK, 1=BID, 2=TRADE)
2. **SYMBOL**: String (e.g. "EURUSD")
3. **PRICE**: Double
4. **VOLUME**: Long
5. **TIMESTAMP**: Long (Epoch Milliseconds)

**Example**:
`"1|EURUSD|1.08500|5000|1705678900123"`
