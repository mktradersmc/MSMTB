import { Socket } from "socket.io-client";
import { socketService } from "./socket";
import { getBaseUrl } from '../lib/client-api';

const HUB_URL = getBaseUrl();

class CommunicationHub {
    private socket: Socket;
    private static instance: CommunicationHub;
    private subscribers: Set<string> = new Set();
    private reconnectTimer: NodeJS.Timeout | null = null;

    private constructor() {
        // Use the shared socket instance
        this.socket = socketService.getSocket();
        this.setupListeners();
    }

    public static getInstance(): CommunicationHub {
        if (!CommunicationHub.instance) {
            CommunicationHub.instance = new CommunicationHub();
        }
        return CommunicationHub.instance;
    }

    // Initialize listeners on the shared socket
    private setupListeners() {
        console.log("[CommunicationHub] Hooking into Shared Socket...");

        if (this.socket.connected) {
            this.onConnect();
        }

        this.socket.on("connect", () => this.onConnect());

        this.socket.on("disconnect", (reason) => {
            console.warn("[CommunicationHub] Disconnected:", reason);
        });

        this.socket.on("connect_error", (err) => {
            console.error("[CommunicationHub] Connection Error:", err.message);
        });
    }

    private onConnect() {
        console.log("[CommunicationHub] Connected via Shared Socket:", this.socket.id);
        console.log(`[CommunicationHub] Re-subscribing to ${this.subscribers.size} active symbols...`);

        // Re-subscribe to all active symbols
        this.subscribers.forEach(key => {
            const parts = key.split('|');
            const symbol = parts[0];
            const tf = parts.length > 1 ? parts[1] : "M1";

            // Add TraceID for consistency with manual subscribe (Task: Automate Re-Sync)
            const traceId = `RESUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            console.log(`[CommunicationHub] 🔄 Re-subscribing: ${symbol} ${tf} (${traceId})`);

            this.socket.emit("subscribe", symbol, tf, traceId);
        });
    }

    // Deprecated but kept for compatibility
    public connect() {
        // No-op: Socket is managed by socketService
    }

    public getSocket(): Socket {
        return this.socket;
    }

    public subscribe(routingKey: string, timeframe: string = "M1") {
        routingKey = routingKey.trim();
        timeframe = timeframe.trim();

        // Store unique key for re-subscription
        const key = `${routingKey}|${timeframe}`;
        this.subscribers.add(key);

        if (this.socket?.connected) {
            // Send as separate arguments matching SocketServer handler
            const traceId = `TRC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            console.log(`[!!! ALARM-FLOW-TICKSPY 2 !!!] [CommunicationHub] Frontend Emit | socket.emit('subscribe', '${routingKey}', '${timeframe}')`);

            // Pass TraceID as 3rd arg
            this.socket.emit("subscribe", routingKey, timeframe, traceId);
        }
    }

    public unsubscribe(routingKey: string, timeframe: string) {
        const key = `${routingKey}|${timeframe}`;
        this.subscribers.delete(key);

        if (this.socket?.connected) {
            // Send as object to support granular unsubscribe in Backend
            this.socket.emit("unsubscribe", { routingKey, timeframe });
        }
    }

    public on(event: string, callback: (...args: any[]) => void) {
        // Trace logging for specific events
        if (event === 'bar_update') {
            this.socket.on(event, (...args: any[]) => {
                // TRACE POINT A
                const payload = args[0];
                if (payload && payload.symbol) {
                    // console.log(`[CommunicationHub] TRACE A: Hub received Tick for ${payload.symbol} ${payload.timeframe}`);
                }
                callback(...args);
            });
        } else {
            this.socket.on(event, callback);
        }
    }

    public off(event: string, callback: (...args: any[]) => void) {
        this.socket.off(event, callback);
    }

    public disconnect() {
        // Do NOT disconnect shared socket.
        // Only remove listeners if needed?
        console.warn("[CommunicationHub] Disconnect called but ignored (Shared Socket)");
    }
}

export const communicationHub = CommunicationHub.getInstance();
