import { io } from "socket.io-client";

const socket = io("https://food-order-app-1-tkp5.onrender.com", {
  path: "/socket.io",
  transports: ["websocket"],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

export default socket;
