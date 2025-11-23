import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/authRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  "https://food-order-jm9ha0pc7-tushar73-jets-projects.vercel.app", 
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
  console.log("Client connected:", socket.id);

  socket.on("join_order_room", (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`Client joined room: order_${orderId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.use((req, res, next) => {
  req.io = io;
  next();
});


app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/orders", orderRoutes);


server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
