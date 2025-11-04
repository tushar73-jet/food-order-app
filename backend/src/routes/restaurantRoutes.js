import express from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();

// GET all restaurants
router.get("/", async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        products: {
          take: 1,
        },
      },
    });
    console.log(`✅ Found ${restaurants.length} restaurants`);
    res.json(restaurants);
  } catch (error) {
    console.error("❌ Error fetching restaurants:", error);
    console.error("Error details:", error.message);
    res.status(500).json({ 
      error: "Server error fetching restaurants",
      details: error.message 
    });
  }
});

// GET restaurant by ID with products
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
    console.error("Error fetching restaurant:", error);
    res.status(500).json({ error: "Server error fetching restaurant" });
  }
});

export default router;

