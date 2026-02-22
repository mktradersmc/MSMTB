
import { io, Socket } from 'socket.io-client';

const URL = 'http://127.0.0.1:3005';

class SocketService {
    public socket: Socket;

    constructor() {
        this.socket = io(URL, {
            autoConnect: true,
            reconnection: true,
            transports: ['websocket'], // FORCE Websocket to avoid 400 Bad Request Polling
            withCredentials: true,
        });

        this.socket.on('connect', () => {
            console.log('[Socket] Connected to market-data-core');
        });

        this.socket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
        });
    }

    getSocket() {
        return this.socket;
    }
}

// Export singleton
export const socketService = new SocketService();
