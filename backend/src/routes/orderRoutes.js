import express from "express";
import prisma from "../lib/prisma.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- Create a new order ---
// POST /api/orders
// This is a protected route
router.post("/", protect, async (req, res) => {
  // req.userId is attached by the 'protect' middleware
  const userId = req.userId;
  const { items, totalPrice } = req.body; // items is an array: [{ productId, quantity }, ...]

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "No items in cart" });
  }

  try {
    // We use a transaction to ensure all or nothing.
    // If creating the OrderItems fails, the Order itself will be rolled back.
    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. Create the Order
      const order = await tx.order.create({
        data: {
          userId,
          totalPrice: parseFloat(totalPrice),
        },
      });

      // 2. Create the OrderItems
      // Prepare data for all items
      const orderItemsData = items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
      }));

      // Create all items in the OrderItem table
      await tx.orderItem.createMany({
        data: orderItemsData,
      });

      return order;
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Order creation failed:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

export default router;