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
import { logger } from "./lib/logger.js";
import { v4 as uuidv4 } from "uuid";
import client from "prom-client";

const app = express();
const PORT = env.PORT || 3001;

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [50, 100, 200, 300, 400, 500, 1000]
});

app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDurationMicroseconds
      .labels(req.method, req.route ? req.route.path : req.path, res.statusCode)
      .observe(duration);
      
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration
    });
  });
  
  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Root route for health check
app.get("/", (req, res) => {
  res.json({ message: "Backend is running successfully!" });
});

// API root route
app.get("/api/health", async (req, res) => {
  let dbStatus = "Checking...";
  try {
    // Check connection AND schema readiness (findMany forces column check)
    await prisma.user.findMany({ take: 1 });
    dbStatus = "connected";
  } catch (error) {
    dbStatus = "error";
    logger.error("Health Check DB Error:", { error: error.message });
  }

  res.json({
    status: "healthy",
    version: "1.0.0",
    uptime: process.uptime(),
    database: dbStatus,
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
    cors_allowed: !!env.CORS_ORIGINS
  });
});

app.get("/api", (req, res) => {
  res.json({ message: "API is reachable" });
});

// Startup Security Checks
if (!env.RAZORPAY_WEBHOOK_SECRET) {
  logger.warn("RAZORPAY_WEBHOOK_SECRET is not configured. Webhooks will fail validation.");
}
if (env.ALLOW_DEMO_PAYMENTS) {
  logger.info("ALLOW_DEMO_PAYMENTS is enabled. Mobile testing mode is ACTIVE.");
}
if (env.NODE_ENV === "production" && !env.CORS_ORIGINS) {
  logger.warn("CORS_ORIGINS is not set in production. Browser requests will be BLOCKED.");
}



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

    logger.error(`CORS blocked origin: ${origin}`);
    return callback(new Error("CORS: Origin not allowed"), false);
  },
  credentials: true,
  optionsSuccessStatus: 200, // Important for legacy browsers/preflights
};

app.use(cors(corsOptions));

app.set("trust proxy", 1);
app.use(helmet());
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
  if (status === 500) {
    logger.error("Unhandled Exception:", { error: err.message, stack: err.stack, requestId: req.id });
  } else {
    logger.warn("App Error:", { error: err.message, status, requestId: req.id });
  }
  res.status(status).json({ 
    error: status === 500 ? "Internal server error" : err.message,
    requestId: req.id
  });
});

server.listen(PORT);
