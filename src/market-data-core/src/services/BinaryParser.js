const util = require('util');

/**
 * Universal Binary Candle Protocol (UBCP) Parser
 * Version: 1.0 (Little-Endian)
 */
class BinaryParser {
    constructor() {
        this.buffer = Buffer.alloc(0);
        this.HEADER_SIZE = 28; // v1.3 Header Size (24 + 4)
        this.CANDLE_SIZE = 48;
        this.LIVE_EXT_SIZE = 16;
    }

    /**
     * Appends new data and attempts to parse packets.
     * @param {Buffer} chunk 
     * @returns {Array<Object>} Array of parsed messages { type, symbol, timeframe, candles: [], ... }
     */
    parse(chunk) {
        if (chunk && chunk.length > 0) {
            this.buffer = Buffer.concat([this.buffer, chunk]);
        }

        const messages = [];

        while (this.buffer.length >= this.HEADER_SIZE) {

            // 1. Peek Header
            const magic = this.buffer.readUInt8(0);
            if (magic !== 0xAF) {
                // Non-Binary Data detected (likely JSON or Garbage).
                // Stop parsing and let the caller handle the buffer residue.
                // console.warn("[BinaryParser] Found non-binary data (Magic != 0xAF). Stopping parse.");
                break;
            }

            const type = this.buffer.readUInt8(1);
            const count = this.buffer.readUInt16LE(2); // Count of blocks following

            // Symbol (16 chars, v1.2)
            let symbol = this.buffer.toString('utf8', 4, 20);
            const nullByte = symbol.indexOf('\0');
            if (nullByte !== -1) symbol = symbol.substring(0, nullByte);

            const tfSec = this.buffer.readUInt32LE(20); // Offset 20
            const requestId = this.buffer.readUInt32LE(24); // Offset 24 (New)

            // 2. Calculate Expected Size
            // Each block contains a Candle (48B).
            // If Type=1 (Live), each block ALSO has Live Ext (16B)? 
            // The MQL5 implementation writes Header + Candle + Live (if type=1).
            // "Buffer includes header + N * (Candle + Ext??)"
            // MQL5 OnAutoTick with Count=1:
            // FileWriteStruct(header) -> 16
            // FileWriteStruct(candle) -> 48
            // FileWriteStruct(live) -> 16
            // Total = 16 + 48 + 16 = 80 bytes.

            // MQL5 HandleFetchHistory with Count=N:
            // Header (Type 2)
            // Loop N: Candle
            // No Live Ext.

            let blockSize = 0;
            if (type === 1) { // Live / Tick
                blockSize = this.CANDLE_SIZE + this.LIVE_EXT_SIZE;
            } else if (type === 2) { // History
                blockSize = this.CANDLE_SIZE;
            } else if (type === 3) { // Raw Tick
                blockSize = this.CANDLE_SIZE + this.LIVE_EXT_SIZE; // Assumed same as Live
            } else if (type === 8 || type === 9) { // ACK_EMPTY (8) or LAST_BAR (9)
                blockSize = 0; // Payload is usually empty or custom handled. Assuming Standard Header Only if Count=0.
            } else {
                console.error("[BinaryParser] Unknown Type:", type);
                this.buffer = this.buffer.slice(1); // Seek
                continue;
            }

            const totalSize = this.HEADER_SIZE + (count * blockSize);

            // 3. Check Packet Completeness
            if (this.buffer.length < totalSize) {
                // Wait for more data
                break;
            }

            // 4. Parse Packet
            // 4. Parse Packet
            // Task 0184: ACK_EMPTY (8) and LAST_BAR (9)
            let msgType = 'UNKNOWN';
            if (type === 1) msgType = 'TICKS_BATCH';
            else if (type === 2) msgType = 'HISTORY_DATA'; // Also used for LastBar w/ data? No.
            else if (type === 3) msgType = 'TICKS_BATCH'; // Raw Tick
            else if (type === 7) msgType = 'HISTORY_BATCH'; // Explicit History Batch
            else if (type === 8) msgType = 'ACK_EMPTY';
            else if (type === 9) msgType = 'LAST_BAR_RESPONSE';

            const packetObj = {
                type: msgType,
                symbol: symbol,
                timeframe: this.secondsToTf(tfSec),
                requestId: requestId,
                data: []
            };

            let offset = this.HEADER_SIZE;

            // Special handling: MQL5 'History' might be BULK_RESPONSE if it's multiple?
            // No, Type 2 translates to HISTORY_DATA structure.

            for (let i = 0; i < count; i++) {
                const timeSec = this.buffer.readBigInt64LE(offset);
                const open = this.buffer.readDoubleLE(offset + 8);
                const high = this.buffer.readDoubleLE(offset + 16);
                const low = this.buffer.readDoubleLE(offset + 24);
                const close = this.buffer.readDoubleLE(offset + 32);
                const volume = this.buffer.readBigInt64LE(offset + 40);

                offset += 48;

                const candle = {
                    time: Number(timeSec), // Keep as Seconds for SyncManager Timezone Detection
                    open: open,
                    high: high,
                    low: low,
                    close: close,
                    volume: Number(volume)
                };

                if (type === 1 || type === 3) {
                    const bid = this.buffer.readDoubleLE(offset);
                    const ask = this.buffer.readDoubleLE(offset + 8);
                    offset += 16;

                    // Add Tick Data
                    candle.b = bid;
                    candle.a = ask;

                    // For TICKS_BATCH, backend expects {s, tf, t, o, h, l, c, v, b, a}
                    // We can return structure that matches SyncManager expectation
                    // SyncManager processStreamData expects { s, tf, t, o... }
                    // Let's normalize here.

                    const streamItem = {
                        s: symbol,
                        tf: packetObj.timeframe,
                        t: candle.time,
                        o: candle.open,
                        h: candle.high,
                        l: candle.low,
                        c: candle.close,
                        v: candle.volume,
                        b: candle.b,
                        a: candle.a
                    };
                    packetObj.data.push(streamItem);
                } else {
                    // History
                    packetObj.data.push(candle);
                }
            }

            messages.push(packetObj);

            // Remove processed packet from buffer
            this.buffer = this.buffer.slice(totalSize);
        }

        return messages;
    }

    secondsToTf(sec) {
        if (sec === 0) return ""; // Tick
        if (sec === 60) return "M1";
        if (sec === 120) return "M2";
        if (sec === 180) return "M3";
        if (sec === 300) return "M5";
        if (sec === 600) return "M10";
        if (sec === 900) return "M15";
        if (sec === 1800) return "M30";
        if (sec === 3600) return "H1";
        if (sec === 7200) return "H2";
        if (sec === 10800) return "H3";
        if (sec === 14400) return "H4";
        if (sec === 21600) return "H6";
        if (sec === 28800) return "H8";
        if (sec === 43200) return "H12";
        if (sec === 86400) return "D1";
        if (sec === 604800) return "W1";
        if (sec === 2592000) return "MN1"; // Task 0225
        return "M1"; // Fallback
    }
}

module.exports = BinaryParser;
