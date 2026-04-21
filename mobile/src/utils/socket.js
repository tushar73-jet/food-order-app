import { io } from "socket.io-client";

import { SOCKET_URL } from "../config";

const socket = io(SOCKET_URL, {
  autoConnect: true,
});

export default socket;
