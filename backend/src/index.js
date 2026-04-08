import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/authRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Root route for health check
app.get("/", (req, res) => {
  res.json({ message: "Backend is running successfully!" });
});

// API root route
app.get("/api", (req, res) => {
  res.json({ message: "API is reachable" });
});

 

const corsOptions = {
  origin: true, // Echoes the request origin dynamically
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST", "PUT"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

io.on("connection", (socket) => {
  socket.on("join_order_room", (orderId) => {
    socket.join(`order_${orderId}`);
  });
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);

server.listen(PORT);
