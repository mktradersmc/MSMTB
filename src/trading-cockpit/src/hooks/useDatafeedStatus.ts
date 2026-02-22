import { useState, useEffect } from 'react';
import { socketService } from '../services/socket';

interface DatafeedStatus {
    isOnline: boolean;
    botId: string;
    key: string;
}

export type ExecutionState = 'IDLE' | 'ERROR' | 'PARTIAL' | 'REJECTED';

const POLLING_INTERVAL = 500; // 500ms as requested

export function useDatafeedStatus(symbol: string) {
    const [isOnline, setIsOnline] = useState<boolean>(true); // Default to true to prevent initial flash
    const [statusData, setStatusData] = useState<DatafeedStatus | null>(null);

    // NEW: Execution State
    const [executionState, setExecutionState] = useState<ExecutionState>('IDLE');
    const [executionMessage, setExecutionMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!symbol) return;

        let isMounted = true;

        const checkStatus = async () => {
            try {
                // Use relative path assuming proxied or direct access
                const res = await fetch(`http://127.0.0.1:3005/api/status/datafeed?symbol=${symbol}`);
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) {
                        setIsOnline(data.online);
                        setStatusData(data);
                    }
                } else {
                    if (isMounted) setIsOnline(false);
                }
            } catch (e) {
                console.warn("[DatafeedStatus] Polling Failed", e);
                if (isMounted) setIsOnline(false);
            }
        };

        // Initial check
        checkStatus();

        const timer = setInterval(checkStatus, POLLING_INTERVAL);

        return () => {
            isMounted = false;
            clearInterval(timer);
        };
    }, [symbol]);

    // NEW: Socket Listener for Execution Results
    useEffect(() => {
        if (!statusData?.botId) return;

        const onExecutionResult = (payload: any) => {
            if (payload.botId === statusData.botId) {
                console.log("[DatafeedStatus] 🚨 Execution Result:", payload);
                if (['ERROR', 'PARTIAL', 'REJECTED'].includes(payload.status)) {
                    setExecutionState(payload.status);
                    setExecutionMessage(payload.message);

                    // Auto-Reset after 10s (Flash)
                    // setTimeout(() => setExecutionState('IDLE'), 10000); 
                    // User might want it persistent until next trade? 
                    // Let's keep it 10s for now, or let component handle dismiss.
                }
            }
        };

        const socket = socketService.getSocket();
        socket.on('execution_result', onExecutionResult);

        return () => {
            socket.off('execution_result', onExecutionResult);
        };
    }, [statusData?.botId]);

    return { isOnline, statusData, executionState, executionMessage };
}
