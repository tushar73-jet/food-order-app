import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Update CORS to allow your new frontend domain
app.use(cors({
  origin: [
    "https://food-order-app-ten-sigma.vercel.app/"  
  ],
  credentials: true
}));

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});