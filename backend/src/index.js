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

const allowedOrigins = [
  "https://food-order-app-ten-sigma.vercel.app",
  "https://food-order-app-git-main-tushar73-jets-projects.vercel.app",
  "https://food-order-app-1-tkp5.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
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
