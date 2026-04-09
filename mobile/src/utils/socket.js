import { io } from "socket.io-client";

// Replace with your actual backend URL or local IP address + port
// Example: "http://192.168.1.100:5000"
const SOCKET_URL = "http://192.168.143.96:3001";

const socket = io(SOCKET_URL, {
  autoConnect: true,
});

export default socket;
