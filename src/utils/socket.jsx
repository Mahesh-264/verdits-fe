import { io } from "socket.io-client";
import { getAccessToken } from './authStorage';

const getSocketUrl = () => {
    if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
    if (import.meta.env.VITE_API_URL) {
        try {
            return new URL(import.meta.env.VITE_API_URL).origin;
        } catch {
            // Fall through to the current origin for relative development URLs.
        }
    }
    if (typeof window !== 'undefined') return window.location.origin;
    return undefined;
};

const socket = io(getSocketUrl(), {
    auth: {
        token: getAccessToken()
    },
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
});

// 🔌 Update token dynamically when it changes
socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
    // Try to reconnect with fresh token
    const freshToken = getAccessToken();
    if (freshToken && socket.auth.token !== freshToken) {
        socket.auth.token = freshToken;
        socket.connect();
    }
});

export default socket;
