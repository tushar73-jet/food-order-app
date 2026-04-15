import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import jwt from "jsonwebtoken";
import prisma from "./lib/prisma.js";
import { env } from "./config/env.js";

const app = express();
const PORT = env.PORT || 3001;

// Root route for health check
app.get("/", (req, res) => {
  res.json({ message: "Backend is running successfully!" });
});

// API root route
app.get("/api", (req, res) => {
  res.json({ message: "API is reachable" });
});

 

const allowedOrigins = (env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients (no Origin header)
    if (!origin) return callback(null, true);

    if (env.NODE_ENV !== "production") {
      // Dev: allow any origin to keep local testing simple
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS: Origin not allowed"), false);
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.set("trust proxy", 1);
app.use(helmet());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(express.json({ limit: "1mb" }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.NODE_ENV !== "production" ? true : allowedOrigins,
    methods: ["GET", "POST", "PUT"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      (typeof socket.handshake.headers?.authorization === "string" &&
      socket.handshake.headers.authorization.startsWith("Bearer ")
        ? socket.handshake.headers.authorization.split(" ")[1]
        : undefined);

    if (!token) return next(new Error("Unauthorized"));

    const decoded = jwt.verify(token, env.JWT_SECRET);
    socket.user = { id: decoded.userId, role: decoded.role, email: decoded.email };
    return next();
  } catch (e) {
    return next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.on("join_order_room", async (orderId) => {
    const id = Number(orderId);
    if (!Number.isFinite(id)) return;

    try {
      const order = await prisma.order.findUnique({
        where: { id },
        select: { id: true, userId: true },
      });
      if (!order) return;

      const isAdmin = socket.user?.role === "ADMIN";
      const isOwner = socket.user?.id === order.userId;
      if (!isAdmin && !isOwner) return;

      socket.join(`order_${id}`);
    } catch {
      // ignore
    }
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

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err?.statusCode || 500;
  if (env.NODE_ENV !== "production") {
    console.error(err);
  }
  res.status(status).json({ error: status === 500 ? "Internal server error" : err.message });
});

server.listen(PORT);
