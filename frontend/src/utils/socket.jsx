import { io } from "socket.io-client";

// Use environment variable for socket connection, fallback to API URL or localhost
const socketURL = import.meta.env.VITE_SOCKET_URL || 
                  import.meta.env.VITE_API_URL || 
                  "http://localhost:3001";

const socket = io(socketURL, {
  path: "/socket.io",
  transports: ["websocket", "polling"],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Socket disconnected");
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
});

export default socket;
