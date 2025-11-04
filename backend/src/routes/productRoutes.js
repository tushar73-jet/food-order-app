import express from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();

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

export default router;