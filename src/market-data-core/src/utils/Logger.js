const fs = require('fs');
const path = require('path');
const util = require('util');

class ForensicLogger {
    constructor() {
        this.logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }

        this.logFile = path.join(this.logDir, 'console-parallel.log');
        this.writeStream = fs.createWriteStream(this.logFile, { flags: 'a', highWaterMark: 4096 }); // 4KB buffer for faster feedback

        // Metrics
        this.stats = {
            logsPerSec: 0,
            lagMs: 0
        };

        // Frequency Analysis
        this.messageCounts = new Map();

        this.originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error
        };

        this.initLagMonitor();
        this.initTrafficMonitor();
        this.initFrequencyDumper();
    }

    initLagMonitor() {
        let lastCheck = Date.now();
        setInterval(() => {
            const now = Date.now();
            const delta = now - lastCheck;
            const lag = delta - 500; // Expected 500ms
            this.stats.lagMs = lag;

            if (lag > 20) {
                this.logInternal(`[BLOCKING] Event Loop Lag: ${lag}ms`);
            }
            lastCheck = now;
        }, 500); // Check every 500ms
    }

    initTrafficMonitor() {
        setInterval(() => {
            if (this.stats.logsPerSec > 10) {
                // this.logInternal(`[TRAFFIC] ${this.stats.logsPerSec} logs/sec`);
            }
            this.stats.logsPerSec = 0;
        }, 1000);
    }

    initFrequencyDumper() {
        setInterval(() => {
            this.dumpFrequencyReport();
        }, 60000); // Every minute
    }

    dumpFrequencyReport() {
        if (this.messageCounts.size === 0) return;

        const sorted = [...this.messageCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        let report = `\n--- 📊 TOP 10 LOG SOURCES (Last Minute) ---\n`;
        sorted.forEach(([msg, count]) => {
            report += `[${count}] ${msg}\n`;
        });
        report += `-------------------------------------------\n`;

        this.writeStream.write(report);
        // Reset counts for next minute? Or keep rolling? 
        // Resetting gives better "Current State" view.
        this.messageCounts.clear();
    }

    logInternal(msg) {
        const timestamp = new Date().toISOString();
        const line = `[${timestamp}] ${msg}\n`;
        this.writeStream.write(line);
    }

    intercept() {
        const self = this;

        // Hook LOG
        console.log = function (...args) {
            self.stats.logsPerSec++;
            const msg = util.format(...args);
            self.trackFrequency(msg);

            self.writeStream.write(`[LOG] [${new Date().toISOString()}] ${msg}\n`);
            self.originalConsole.log.apply(console, args);
        };

        // Hook WARN
        console.warn = function (...args) {
            self.stats.logsPerSec++;
            const msg = util.format(...args);
            self.trackFrequency(msg);

            self.writeStream.write(`[WARN] [${new Date().toISOString()}] ${msg}\n`);
            self.originalConsole.warn.apply(console, args);
        };

        // Hook ERROR
        console.error = function (...args) {
            self.stats.logsPerSec++;
            const msg = util.format(...args);
            self.trackFrequency(msg);

            self.writeStream.write(`[ERROR] [${new Date().toISOString()}] ${msg}\n`);
            self.originalConsole.error.apply(console, args);
        };

        this.logInternal("=== FORENSIC LOGGER ATTACHED ===");
    }

    trackFrequency(msg) {
        // Simple heuristic: Take first 50 chars as "Signature" to group similar messages
        const signature = msg.substring(0, 60).replace(/\d+/g, 'N'); // Mask numbers
        const count = this.messageCounts.get(signature) || 0;
        this.messageCounts.set(signature, count + 1);
    }
}

// Singleton Auto-Init
const logger = new ForensicLogger();
logger.intercept();

module.exports = logger;
