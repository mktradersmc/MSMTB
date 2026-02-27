
import { io, Socket } from 'socket.io-client';

const getSocketUrl = () => {
    if (typeof window !== 'undefined') {
        return `${window.location.protocol}//${window.location.hostname}:3005`;
    }
    return 'http://127.0.0.1:3005';
};

const URL = getSocketUrl();

class SocketService {
    public socket: Socket;

    constructor() {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';

        this.socket = io(URL, {
            autoConnect: true,
            reconnection: true,
            transports: ['websocket'], // FORCE Websocket to avoid 400 Bad Request Polling
            withCredentials: true,
            auth: {
                token: token
            }
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
