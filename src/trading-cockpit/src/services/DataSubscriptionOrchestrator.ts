
import { communicationHub } from "./CommunicationHub";

type SubscriptionKey = string; // Format: "SYMBOL|TIMEFRAME"
type PaneId = string;

class DataSubscriptionOrchestrator {
    private static instance: DataSubscriptionOrchestrator;

    // Map of active subscriptions: Key -> Map of PaneIDs to their Callbacks
    private subscriptions: Map<SubscriptionKey, Map<PaneId, (bar: any) => void>> = new Map();

    // Map of pending termination timeouts: Key -> Timeout ID
    private pendingTerminations: Map<SubscriptionKey, NodeJS.Timeout> = new Map();

    private readonly GRACE_PERIOD_MS = 10000;
    private isVisible: boolean = true;
    private visibilityDebounceTimer: NodeJS.Timeout | null = null;
    private readonly VISIBILITY_DEBOUNCE_MS = 2000;

    private constructor() {
        if (typeof document !== 'undefined') {
            this.isVisible = document.visibilityState === 'visible';
            document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        }

        // Trace Point B (Setup): Listening to Hub
        // 4. Tick Relay: Listen to ALL bar updates globally
        communicationHub.on('bar_update', this.onDataReceived.bind(this));
    }

    public static getInstance(): DataSubscriptionOrchestrator {
        if (!DataSubscriptionOrchestrator.instance) {
            DataSubscriptionOrchestrator.instance = new DataSubscriptionOrchestrator();
        }
        return DataSubscriptionOrchestrator.instance;
    }

    /**
     * Ticks from Backend -> Orchestrator -> Many Subscribers
     */
    private onDataReceived(payload: any) {
        // Trace Point B (Execution): Orchestrator received tick
        // payload should have { symbol, timeframe, ...barData }
        if (!payload || !payload.symbol || !payload.timeframe) return;
        console.log(`[Orchestrator] Data received for ${payload.symbol} ${payload.timeframe}`);
        const key = this.getKey(payload.symbol, payload.timeframe);
        const subscribers = this.subscriptions.get(key);

        if (subscribers && subscribers.size > 0) {
            console.log(`[Orchestrator] TRACE B: Relaying tick for ${key} to ${subscribers.size} subscribers`);
            subscribers.forEach((callback) => {
                callback(payload);
            });
        } else {
            console.warn(`[Orchestrator] TRACE C: Received tick for ${key} but NO subscribers found in Map! Keys:`, [...this.subscriptions.keys()]);
        }
    }

    public subscribe(symbol: string, timeframe: string, paneId: PaneId, callback: (bar: any) => void) {
        const key = this.getKey(symbol, timeframe);

        // DIAGNOSTIC LOG (Task: Fix Over-Subscription)
        console.log(`[Orchestrator] 📥 SUBSCRIBE Request: ${key} [Pane: ${paneId}] (Visible: ${this.isVisible})`);

        // 1. Cancel any pending termination for this key
        if (this.pendingTerminations.has(key)) {
            console.log(`[Orchestrator] ♻️ Cancelled termination for ${key}`);
            clearTimeout(this.pendingTerminations.get(key)!);
            this.pendingTerminations.delete(key);
        }

        // 2. Add subscriber & callback
        if (!this.subscriptions.has(key)) {
            this.subscriptions.set(key, new Map());
            // New stream needed
            this.initiateStream(symbol, timeframe);
        }

        /* TRACE POINT C (Storage) */
        this.subscriptions.get(key)!.set(paneId, callback);
        console.log(`[Orchestrator] TRACE C: Stored callback for ${key} [Pane: ${paneId}]. Total subs: ${this.subscriptions.get(key)!.size}`);

        // 3. Visibility Check logic
        if (!this.isVisible) {
            this.pauseStream(symbol, timeframe);
        }
    }

    public unsubscribe(symbol: string, timeframe: string, paneId: PaneId) {
        const key = this.getKey(symbol, timeframe);
        const subscribers = this.subscriptions.get(key);

        if (!subscribers) return;

        console.log(`[Orchestrator] Unsubscribe Request: ${key} [Pane: ${paneId}]`);

        subscribers.delete(paneId);

        if (subscribers.size === 0) {
            // No more subscribers - Start Grace Period
            console.log(`[Orchestrator] ⏳ Starting Grace Period for ${key} (${this.GRACE_PERIOD_MS}ms)`);

            const timeout = setTimeout(() => {
                this.terminateStream(symbol, timeframe);
            }, this.GRACE_PERIOD_MS);

            this.pendingTerminations.set(key, timeout);
        }
    }

    private initiateStream(symbol: string, timeframe: string) {
        console.log(`[Orchestrator] 🚀 Initiating Stream: ${symbol} ${timeframe}`);
        communicationHub.subscribe(symbol, timeframe);
    }

    private terminateStream(symbol: string, timeframe: string) {
        const key = this.getKey(symbol, timeframe);

        // Double check no one re-subscribed in the meantime
        if (this.subscriptions.has(key) && this.subscriptions.get(key)!.size > 0) {
            console.warn(`[Orchestrator] ⚠️ Termination aborted, active subscribers found for ${key}`);
            return;
        }

        console.log(`[Orchestrator] 🛑 Terminating Stream: ${symbol} ${timeframe}`);
        communicationHub.unsubscribe(symbol, timeframe);
        this.subscriptions.delete(key);
        this.pendingTerminations.delete(key);
    }

    private pauseStream(symbol: string, timeframe: string) {
        const socket = communicationHub.getSocket();
        if (socket?.connected) {
            console.log(`[Orchestrator] ⏸️ Pausing Stream: ${symbol} ${timeframe}`);
            socket.emit('pause_stream', { symbol, timeframe });
        }
    }

    private resumeStream(symbol: string, timeframe: string) {
        const socket = communicationHub.getSocket();
        if (socket?.connected) {
            console.log(`[Orchestrator] ▶️ Resuming Stream: ${symbol} ${timeframe}`);
            socket.emit('resume_stream', { symbol, timeframe });
        }
    }

    private handleVisibilityChange() {
        const currentlyVisible = document.visibilityState === 'visible';
        console.log(`[Orchestrator] Visibility Event: ${currentlyVisible ? 'VISIBLE' : 'HIDDEN'}`);

        if (this.visibilityDebounceTimer) {
            clearTimeout(this.visibilityDebounceTimer);
            this.visibilityDebounceTimer = null;
        }

        if (currentlyVisible) {
            if (!this.isVisible) {
                this.isVisible = true;
                this.subscriptions.forEach((_, key) => {
                    const [symbol, timeframe] = this.decodeKey(key);
                    this.resumeStream(symbol, timeframe);
                });
            } else {
                console.log(`[Orchestrator] 🙈 Quick toggle detected, staying VISIBLE.`);
            }
        } else {
            this.visibilityDebounceTimer = setTimeout(() => {
                this.isVisible = false;
                console.log(`[Orchestrator] 🌑 Debounce elapsed. Throttling streams.`);
                this.subscriptions.forEach((_, key) => {
                    const [symbol, timeframe] = this.decodeKey(key);
                    this.pauseStream(symbol, timeframe);
                });
            }, this.VISIBILITY_DEBOUNCE_MS);
        }
    }

    private getKey(symbol: string, timeframe: string): string {
        return `${symbol.trim()}|${timeframe.trim()}`;
    }

    private decodeKey(key: string): [string, string] {
        const parts = key.split('|');
        return [parts[0], parts[1]];
    }
}

export const dataSubscriptionOrchestrator = DataSubscriptionOrchestrator.getInstance();
