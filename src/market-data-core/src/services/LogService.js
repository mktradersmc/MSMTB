const fs = require('fs');
const path = require('path');
const config = require('../config');

class LogService {
    constructor() {
        this.logDir = config.LOG_DIR || path.join(__dirname, '..', '..', 'logs');
        this.trafficLogPath = path.join(this.logDir, 'traffic.log');
        this.ensureLogDir();

        // Traffic Stream (Append Mode)
        this.trafficStream = fs.createWriteStream(this.trafficLogPath, { flags: 'a' });

        this.trafficStream.on('error', (err) => {
            console.error('[LogService] FATAL: Traffic Stream Error:', err);
        });

        console.log(`[LogService] 📝 Redirecting High-Frequency Logs to: ${this.trafficLogPath}`);
    }

    ensureLogDir() {
        if (!fs.existsSync(this.logDir)) {
            try {
                fs.mkdirSync(this.logDir, { recursive: true });
            } catch (e) {
                console.error('[LogService] Failed to create log directory:', e);
            }
        }
    }

    /**
     * Determines where to log based on message type.
     * High Frequency -> File
     * Low Frequency -> Console
     */

    handlePipeMessage(type, senderId, msg) {
        // Suppress Polling Noise completely causing I/O lag
        if (type === 'CMD_POLL') return;

        // PERFORMANCE FIX: Disable File Logging for High-Frequency Status/Ticks
        // Writing 20x/sec to disk (even async stream) causes GC pressure and CPU load (JSON.stringify)
        if (type === 'STATUS_HEARTBEAT' || type === 'STATUS_UPDATE' || type === 'TICK_DATA') {
            return;
        }

        if (this.isHighFrequency(type)) {
            this.logToFile(type, senderId, msg);
        } else {
            // Standard Console Log (Process Chain Visibility)
            console.log(`[Pipe] 📥 INCOMING ${type} from ${senderId} (Size: ${JSON.stringify(msg).length})`);
        }
    }

    isHighFrequency(type) {
        const hf = [
            'STATUS_HEARTBEAT',
            'STATUS_UPDATE',
            'TICK_DATA',
            'TICKS_BATCH',
            'CMD_POLL' // Polls are frequent if no data, but usually we filter empty polls elsewhere
        ];
        return hf.includes(type);
    }

    getTimestamp() {
        const now = new Date();
        const time = now.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const ms = String(now.getMilliseconds()).padStart(3, '0');
        return `[${time}.${ms}]`;
    }

    formatLog(sender, msg) {
        return `${this.getTimestamp()} [${sender}] ${msg}`;
    }

    logToFile(type, senderId, msg) {
        // [TEST] AGGRESSIVE DISABLE - USER REQUEST
        // Complete No-Op to prove if Disk I/O is the bottleneck.
        return;

        /*
        // Redirect to FILE to avoid console spam
        const line = `${this.formatLog(senderId, JSON.stringify(msg))}\n`;
        if (this.trafficStream && this.trafficStream.writable) {
            this.trafficStream.write(line);
        }
        */
    }

    /**
     * Direct traffic logger for specific debug needs
     */
    traffic(text) {
        const line = `${this.getTimestamp()} [TRAFFIC] ${text}\n`;
        if (this.trafficStream && this.trafficStream.writable) {
            this.trafficStream.write(line);
        }
    }
}

module.exports = new LogService();
