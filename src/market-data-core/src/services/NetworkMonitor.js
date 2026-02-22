const EventEmitter = require('events');
const dns = require('dns');

class NetworkMonitor extends EventEmitter {
    constructor() {
        super();
        this.isOnline = true; // Assume online initially to allow startup sync
        this.checkInterval = 5000; // 5 seconds (User Requested)
        this.timer = null;
        this.start();
    }

    start() {
        // Initial Check
        this.checkConnectivity();
        // Loop
        this.timer = setInterval(() => this.checkConnectivity(), this.checkInterval);
    }

    checkConnectivity() {
        // Simple DNS check to Google
        dns.resolve('google.com', (err) => {
            const currentStatus = !err;

            if (currentStatus !== this.isOnline) {
                this.isOnline = currentStatus;
                console.log(`[NetworkMonitor] 🌐 Connectivity Change: ${this.isOnline ? 'ONLINE' : 'OFFLINE'}`);
                this.emit(this.isOnline ? 'online' : 'offline');
            }
        });
    }

    getStatus() {
        return this.isOnline;
    }
}

module.exports = new NetworkMonitor();
