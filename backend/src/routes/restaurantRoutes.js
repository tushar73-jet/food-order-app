import express from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        products: {
          take: 1,
        },
      },
    });
    res.json(restaurants);
  } catch (error) {
    console.error("Error in GET /api/restaurants:", error);
    res.status(500).json({ error: "Server error fetching restaurants" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: true,
      },
    });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ error: "Server error fetching restaurant" });
  }
});

export default router;