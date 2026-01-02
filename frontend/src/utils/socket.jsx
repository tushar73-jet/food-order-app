import { io } from "socket.io-client";

// Use environment variable for socket connection, fallback to API URL or localhost
const getSocketUrl = () => {
  const url = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:3001";
  // Remove /api suffix if present to get the root URL
  return url.replace(/\/api\/?$/, "");
};

const socketURL = getSocketUrl();

const socket = io(socketURL, {
  path: "/socket.io",
  transports: ["websocket", "polling"],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

export default socket;
