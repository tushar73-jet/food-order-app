import express from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();

// GET all products (optional: filter by restaurant)
router.get("/", async (req, res) => {
  try {
    const { restaurantId } = req.query;
    const where = restaurantId ? { restaurantId: parseInt(restaurantId) } : {};
    
    const products = await prisma.product.findMany({
      where,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Server error fetching products" });
  }
});

// --- GET a single product by ID ---
// GET /api/products/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    console.error("Error fetching product by ID:", error); // <-- ADD THIS LINE
    res.status(500).json({ error: "Server error fetching product" });
  }
});

export default router;