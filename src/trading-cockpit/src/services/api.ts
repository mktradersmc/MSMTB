import { Message } from "../types";

const COMMUNICATION_HUB_URL = "http://127.0.0.1:3005";

export const fetchMessages = async (sinceTimestamp: number = 0): Promise<Message[]> => {
    try {
        const res = await fetch(`${COMMUNICATION_HUB_URL}/getMessages?lastTimestamp=${sinceTimestamp}`);
        if (!res.ok) {
            throw new Error(`Server error: ${res.status}`);
        }
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
            return data.messages;
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch messages:", error);
        return [];
    }
};

export const fetchBotHistory = async (botId: string, limit: number = 100): Promise<Message[]> => {
    // For now, we reuse getMessages but in real implementation efficient history fetch might happen 
    // via a dedicated endpoint if DB grows large.
    return fetchMessages(0);
}

export const sendCommand = async (command: any): Promise<boolean> => {
    try {
        const res = await fetch(`${COMMUNICATION_HUB_URL}/sendCommand`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(command)
        });
        const data = await res.json();
        return data.success;
    } catch (error) {
        console.error("Failed to send command:", error);
        return false;
    }
};

// --- LIVE CHART API ---

export const fetchSymbols = async (botId?: string): Promise<string[]> => {
    try {
        const url = botId ? `${COMMUNICATION_HUB_URL}/symbols?botId=${botId}` : `${COMMUNICATION_HUB_URL}/symbols`;
        const res = await fetch(url);
        if (res.status === 503) {
            throw new Error("No Master Account Configured");
        }
        const data = await res.json();

        // Fallback: If configured list is empty, try getting ALL available symbols?
        // This helps if the User hasn't configured anything yet.
        if (!data.symbols || data.symbols.length === 0) {
            try {
                // Try alternate endpoint if it exists
                const res2 = await fetch(`${COMMUNICATION_HUB_URL}/available-symbols`);
                const data2 = await res2.json();
                if (data2.symbols && data2.symbols.length > 0) return data2.symbols;
            } catch (e2) { }
        }

        return data.symbols || [];
    } catch (error) {
        console.error("Failed to fetch symbols:", error);
        throw error; // Re-throw to let UI handle it
    }
};

export const startStream = async (clientId: string, symbol: string): Promise<boolean> => {
    try {
        await fetch(`${COMMUNICATION_HUB_URL}/stream/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientId, symbol })
        });
        return true;
    } catch (error) {
        console.error("Failed to start stream:", error);
        return false;
    }
};

export const sendKeepAlive = async (clientId: string): Promise<boolean> => {
    try {
        await fetch(`${COMMUNICATION_HUB_URL}/stream/keepalive`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientId })
        });
        return true;
    } catch (error) {
        return false; // Silent fail
    }
};

export const fetchTicks = async (clientId: string): Promise<any[]> => {
    try {
        const res = await fetch(`${COMMUNICATION_HUB_URL}/stream/ticks?clientId=${clientId}`);
        const data = await res.json();
        return data.ticks || [];
    } catch (error) {
        return [];
    }
};
