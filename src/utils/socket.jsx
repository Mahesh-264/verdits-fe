import { io } from "socket.io-client";
import { getAccessToken } from './authStorage';

const socket = io("http://localhost:5000", {
    auth: {
        token: getAccessToken()
    },
    autoConnect: false
});

export default socket;
