const { parentPort, workerData } = require('worker_threads');
const net = require('net');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const BinaryParser = require('../services/BinaryParser');
const tzService = require('../services/TimezoneNormalizationService');

// --- WORKER CONFIG ---
const { symbol, botId, pipeSymbol } = workerData;
// Task 0156: Use Mapped Symbol for Pipe Name if provided (Match MT5 _Symbol)
const effectivePipeSymbol = pipeSymbol || symbol;
const PIPE_NAME = `\\\\.\\pipe\\AOS_P_${effectivePipeSymbol}`;
const DB_DIR = path.resolve(__dirname, '../../db/symbols');
const DB_PATH = path.join(DB_DIR, `${symbol}.db`);

// --- ENSURE DB DIR EXISTS ---
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// --- STATE ---
let db = null;
let server = null;
let activeSocket = null;
const activeStreams = new Set(); // Track desired TFs
const binaryParser = new BinaryParser();

// --- LOGGING ---
const log = (msg) => parentPort.postMessage({ type: 'LOG', msg: `[Worker:${symbol}] ${msg}` });
const error = (msg) => parentPort.postMessage({ type: 'ERROR', msg: `[Worker:${symbol}] ${msg}` });

// --- PARENT COMMUNICATION (Control) ---
parentPort.on('message', (msg) => {
    if (msg.type === 'SUBSCRIBE') {
        const tfSeconds = getTfSeconds(msg.timeframe);
        activeStreams.add(msg.timeframe);
        log(`📥 UI Request: ${msg.timeframe} (Buffered)`);

        if (activeSocket) {
            log(`📡 Sending START_LIVE to MT5 for ${msg.timeframe} (${tfSeconds}s)`);
            sendControlPacket(1, tfSeconds);
        } else {
            log(`⏳ Buffered START_LIVE for ${msg.timeframe} (Waiting for Peer)`);
        }
    } else if (msg.type === 'UNSUBSCRIBE') {
        const tfSeconds = getTfSeconds(msg.timeframe);
        activeStreams.delete(msg.timeframe);
        log(`Unsubscribing Live Ticks for TF: ${msg.timeframe}`);

        if (activeSocket) {
            sendControlPacket(0, tfSeconds);
        }
    }
});

// --- HELPERS ---
function getTfSeconds(tf) {
    switch (tf) {
        case 'M1': return 60;
        case 'M2': return 120;
        case 'M3': return 180;
        case 'M5': return 300;
        case 'M10': return 600;
        case 'M15': return 900;
        case 'M30': return 1800;
        case 'H1': return 3600;
        case 'H2': return 7200;
        case 'H3': return 10800;
        case 'H4': return 14400;
        case 'H6': return 21600;
        case 'H8': return 28800;
        case 'H12': return 43200;
        case 'D1': return 86400;
        case 'W1': return 604800;
        default: return 60; // Default M1
    }
}

function sendControlPacket(action, tfSeconds) {
    if (!activeSocket) {
        // log("Cannot send control packet: Socket not connected.");
        return;
    }
    try {
        // UBCP Header (24 bytes) + Body (4 bytes) = 28 bytes
        const buf = Buffer.alloc(28);

        // Header
        buf.writeUInt8(0xAF, 0); // Magic
        buf.writeUInt8(4, 1);    // Type 4 (Control)
        buf.writeUInt16LE(1, 2); // Count 1 (One Body)
        buf.write(symbol, 4, 16, 'utf8'); // Symbol (16 chars)
        buf.writeUInt32LE(tfSeconds, 20); // TF (Offset 20)

        // Body
        buf.writeUInt8(action, 24); // 1=START, 0=STOP
        // Reserved 3 bytes zeroed

        activeSocket.write(buf);
        log(`Sent CONTROL Packet: Action=${action} TF=${tfSeconds}`);
    } catch (e) {
        error(`Control Send Fail: ${e.message}`);
    }
}

// --- DATABASE INITIALIZATION ---
function initDB() {
    try {
        log(`Opening Database: ${DB_PATH}`);
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL'); // MANDATE: WAL Mode
        db.pragma('synchronous = NORMAL');

        // Initialize Tables for relevant TFs
        // EXPANDED (Task 0153): Support all standard Timeframes to prevent "No Such Table" errors.
        const tfs = ['M1', 'M2', 'M3', 'M5', 'M10', 'M15', 'M30', 'H1', 'H2', 'H3', 'H4', 'H6', 'H8', 'H12', 'D1', 'W1', 'MN1'];

        db.transaction(() => {
            tfs.forEach(tf => {
                db.prepare(`
                    CREATE TABLE IF NOT EXISTS candles_${tf} (
                        time INTEGER PRIMARY KEY,
                        open REAL,
                        high REAL,
                        low REAL,
                        close REAL,
                        volume INTEGER,
                        is_complete INTEGER DEFAULT 0
                    )
                `).run();
            });
        })();

        log(`📂 Data Source: .${DB_PATH.replace(__dirname, '').replace('src\\workers\\..\\..\\', '')} (New Instance)`); // Adjust relative path log
        // Actually just use DB_PATH or a cleaner relative path.
        // User wants: [Worker:XAUUSD] 📀 Data Source: ./db/symbols/XAUUSD.db (New Instance)
        // Correct logging:
        log(`📀 Data Source: ./db/symbols/${symbol}.db (New Instance)`);

        const stats = {
            M1: getMaxTime('M1'),
            H1: getMaxTime('H1')
        };
        log(`📂 Database opened. Last M1 candle at: ${stats.M1} (${new Date(stats.M1).toISOString()}), H1: ${new Date(stats.H1).toISOString()}`);
    } catch (e) {
        error(`DB Init Failed: ${e.message}`);
        process.exit(1);
    }
}

// --- DB OPERATIONS ---
const insertStmts = {};
function getInsertStmt(tf) {
    if (!insertStmts[tf]) {
        insertStmts[tf] = db.prepare(`
            INSERT INTO candles_${tf} (time, open, high, low, close, volume, is_complete)
            VALUES (@time, @open, @high, @low, @close, @volume, @is_complete)
            ON CONFLICT(time) DO UPDATE SET
                open=excluded.open,
                high=excluded.high,
                low=excluded.low,
                close=excluded.close,
                volume=excluded.volume,
                is_complete=MAX(candles_${tf}.is_complete, excluded.is_complete)
        `);
    }
    return insertStmts[tf];
}

function getMaxTime(tf) {
    try {
        const row = db.prepare(`SELECT MAX(time) as t FROM candles_${tf}`).get();
        return row ? row.t : 0;
    } catch (e) {
        return 0;
    }
}

// --- PACKET PROCESSING ---
function processPackets(packets) {
    db.transaction(() => {
        packets.forEach(pkt => {
            // pkt: { type, symbol, timeframe, data: [...] }
            if (!pkt.timeframe) return;

            const tf = pkt.timeframe.replace('PERIOD_', '');

            if (pkt.type === 'HISTORY_DATA') {
                // TYPE 2: Write to DB ONLY (Persistence)
                // User Requirement 2: Strict Ingestion & Logging
                // DEBUG TASK 0156: Log Packet details to debug Mapped Symbol history failure
                log(`📦 History Packet Received: Count=${pkt.data.length} PktSymbol='${pkt.symbol}' WorkerSymbol='${symbol}' PipeSymbol='${pipeSymbol}'`);

                // If PipeSymbol is used, we expect PktSymbol to match PipeSymbol (Broker)
                // But we WRITE to 'symbol' (Internal) DB. This is correct.

                const stmt = getInsertStmt(tf);
                try {
                    const count = pkt.data.length;

                    // User Requirement 4.3: Receiving Log
                    log(`Receiving ${count} missing candles from Bot...`);

                    let maxTimeIngested = 0;

                    pkt.data.forEach(candle => {
                        // SANITIZATION: Prevent partial or invalid writes
                        if (!candle || typeof candle.open !== 'number' || isNaN(candle.open)) return;

                        // FIX TASK 0148 & 0149: Timestamp + Timezone Correction
                        // MQL5 sends Broker Seconds. DB expects UTC Milliseconds.
                        let finalTime = candle.time;

                        // Check if it's Seconds (Year < 2286)
                        if (finalTime < 10000000000) {
                            // Use TimezoneService to convert Broker Seconds -> UTC Milliseconds
                            // Note: Worker has fresh TZ Service instance (Default EET), which is safer than raw Broker Time.
                            finalTime = tzService.convertBrokerToUtcMs(botId, finalTime);
                        }

                        stmt.run({
                            time: finalTime,
                            open: candle.open,
                            high: candle.high,
                            low: candle.low,
                            close: candle.close,
                            volume: candle.volume,
                            is_complete: 1
                        });

                        if (finalTime > maxTimeIngested) maxTimeIngested = finalTime;
                    });

                    // User Requirement 4.4: Sync Complete Log
                    const completeTimeStr = new Date(maxTimeIngested).toISOString().replace('T', ' ').substring(0, 19);
                    log(`Sync Complete. DB updated to ${completeTimeStr}`);

                    // FIX TASK 0150: Notify Main Thread (SyncManager) to Unblock UI
                    parentPort.postMessage({
                        type: 'SYNC_COMPLETE_HANDOVER',
                        symbol: symbol,
                        timeframe: tf,
                        maxTime: maxTimeIngested
                    });

                } catch (err) {
                    error(`DB Insert Error (${tf}): ${err.message}`);
                }
            } else if (pkt.type === 'TICKS_BATCH' || pkt.type === 'TICK_DATA') {
                // TYPE 1: Broadcast to Stream ONLY (Realtime)
                // Do NOT write to DB (Performance)

                // SANITIZATION: Filter invalid ticks
                // CORRECTED (Task 0154): BinaryParser produces minified keys (c, v, o, h, l).
                const validTicks = pkt.data.filter(t => t && (
                    (typeof t.c === 'number' && !isNaN(t.c)) ||
                    (typeof t.close === 'number' && !isNaN(t.close))
                ));

                if (validTicks.length === 0) return;

                // REVERT TASK 0149: Send Raw Seconds to SyncManager
                // SyncManager (Line 785) handles Timezone Conversion if `t < 10B`.
                // Sending MS here would BYPASS Timezone Conversion, causing Shifted Data.
                parentPort.postMessage({
                    type: pkt.type,
                    symbol: symbol,
                    timeframe: tf,
                    botId: botId,
                    content: validTicks // Raw Data (Seconds) -> SyncManager will fix TZ
                });

                // PROOF OF LIFE (User Requirement 4.3)
                if (validTicks.length > 0) {
                    // Just log the first one to avoid flood, or maybe every one if user insists?
                    // "I want to see... Incoming Live Tick"
                    const t = validTicks[0];
                    log(`📈 Incoming Live Tick: ${t.c || t.close} (TF=${tf})`);
                }
            }
        });
    })();
}

// --- MIGRATION LOGIC (Lazy ETL) ---
// --- MIGRATION LOGIC (DISABLED - Task 0128 Final Polish) ---
function migrateFromLegacy() {
    log("Migration DISABLED. Using fresh symbol DB only.");
    // Purge logic implied by not using old DB.
}

// --- SERVER LOGIC ---
function startServer() {
    try {
        if (server) server.close();

        log(`Starting Pipe Server: ${PIPE_NAME}`);
        log(`Starting Pipe Server: ${PIPE_NAME}`);
        server = net.createServer({ allowHalfOpen: false }, (stream) => {
            log('🤝 Peer connected. Querying DB for last anchor...');
            activeSocket = stream;

            // --- FLUSH BUFFERED SUBSCRIPTIONS (Task 0155) ---
            if (activeStreams.size > 0) {
                log(`🔄 Flushing ${activeStreams.size} buffered subscriptions to new Peer...`);
                activeStreams.forEach(tf => {
                    const sec = getTfSeconds(tf);
                    sendControlPacket(1, sec);
                });
            }

            // --- SMART HANDSHAKE (Gap Request) ---
            try {
                // 1. Get Max Time (M1 is base for gap fill?) 
                const maxTime = getMaxTime('M1');

                // User Requirement 4.1: Log Last DB Entry
                // "2026-01-29 22:10:00" format
                const dbTimeStr = maxTime > 0 ? new Date(maxTime).toISOString().replace('T', ' ').substring(0, 19) : "NONE";
                log(`Last DB Entry: ${dbTimeStr}`);

                // 2. Send as Int64 (8 bytes)
                const buffer = Buffer.alloc(8);
                const timeVal = BigInt(maxTime || 0);
                buffer.writeBigInt64LE(timeVal, 0);

                stream.write(buffer);

                // User Requirement 4.2: Log Handshake Sent
                log(`Handshake sent to Bot.`);

            } catch (err) {
                error(`Handshake Error: ${err.message}`);
                // Ensure we don't crash loop, but maybe close stream?
            }
            // -------------------------------------

            stream.on('data', (chunk) => {
                try {
                    const packets = binaryParser.parse(chunk);
                    if (packets && packets.length > 0) {
                        // VERIFICATION LOG (Task 0123)
                        if (packets[0] && packets[0].symbol) {
                            // log(`🛠️ Header Check: Symbol='${packets[0].symbol}'`);
                        }

                        if (packets[0].type === 'HISTORY_DATA') {
                            log(`📥 Receiving Gap-Fill: ${packets.length} packets...`);
                        }
                        processPackets(packets);
                    }
                } catch (e) {
                    error(`Parse Error: ${e.message}`);
                }
            });

            stream.on('error', (err) => {
                log(`⚠️ Socket Error: ${err.message}`);
            });

            stream.on('close', () => {
                log('🛑 Peer disconnected. Ready for reconnect.');
                activeSocket = null;
            });
        });

        server.listen(PIPE_NAME, () => {
            log('✅ Listening.');
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                log('Wait... Address in use. Retrying...');
                setTimeout(startServer, 1000);
            } else {
                error(`Server Fatal: ${err.message}`);
            }
        });

    } catch (e) {
        error(`Server Start Failed: ${e.message}`);
    }
}

// --- MAIN ---
initDB();
migrateFromLegacy(); // Run Migration Check on Startup
startServer();

// --- HEARTBEAT / KEEP-ALIVE ---
// --- HEARTBEAT / KEEP-ALIVE ---
setInterval(() => {
    // Watchdog logic is implicit in Server 'error'/'close' handling.
    // We stay alive.
}, 60000);

// --- CLEANUP HANDLERS (Task 0127: Zero-Delay Reconnect) ---
function cleanupAndExit() {
    if (server) {
        log('🛑 Closing Server (Cleanup)...');
        try {
            server.close();
            server.unref();
        } catch (e) {
            // ignore
        }
    }
    if (activeSocket) {
        activeSocket.destroy();
    }
    if (db) {
        try { db.close(); } catch (e) { }
    }
    process.exit(0);
}

process.on('SIGINT', cleanupAndExit);
process.on('SIGTERM', cleanupAndExit);
process.on('exit', () => {
    if (server) server.close();
});
