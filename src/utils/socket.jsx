import { io } from "socket.io-client";
import { getAccessToken } from './authStorage';

const socket = io("http://localhost:5000", {
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
    if (freshToken) {
        socket.auth.token = freshToken;
        socket.connect();
    }
});

export default socket;
