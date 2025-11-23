import express from "express";
import Stripe from "stripe";
import prisma from "../lib/prisma.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Initialize Stripe with error handling
let stripe;
try {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("⚠️  STRIPE_SECRET_KEY not found. Payment features will not work.");
  } else {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
} catch (error) {
  console.error("Failed to initialize Stripe:", error);
}


router.post("/create-payment-intent", protect, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ 
      error: "Payment service not configured. Please set STRIPE_SECRET_KEY in environment variables." 
    });
  }

  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(amount) * 100), // Convert to cents
      currency: "usd",
      metadata: {
        userId: req.userId.toString(),
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Payment intent creation failed:", error);
    res.status(500).json({ error: "Failed to create payment intent: " + error.message });
  }
});

router.post("/confirm-payment", protect, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ 
      error: "Payment service not configured. Please set STRIPE_SECRET_KEY in environment variables." 
    });
  }

  const { paymentIntentId, items, totalPrice } = req.body;

  if (!paymentIntentId || !items || items.length === 0) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Verify payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ error: "Payment not completed" });
    }

    // Create order with payment info
    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: req.userId,
          totalPrice: parseFloat(totalPrice),
          paymentId: paymentIntentId,
          paymentStatus: "PAID",
        },
      });

      const orderItemsData = items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
      }));

      await tx.orderItem.createMany({
        data: orderItemsData,
      });

      return order;
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Order creation with payment failed:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.post("/", protect, async (req, res) => {
  const userId = req.userId;
  const { items, totalPrice } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "No items in cart" });
  }

  try {
    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          totalPrice: parseFloat(totalPrice),
        },
      });

      const orderItemsData = items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
      }));

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

router.get("/my-orders", protect, async (req, res) => {
  const userId = req.userId;

  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(orders);
  } catch (error) {
    console.error("Failed to fetch user orders:", error);
    res.status(500).json({ error: "Failed to load orders" });
  }
});

router.get("/:id", protect, async (req, res) => {
  const { id } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Failed to fetch order:", error);
    res.status(500).json({ error: "Failed to load order" });
  }
});

router.put("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  try {
    const updatedOrder = await prisma.order.update({
      where: { id: Number(id) },
      data: { status },
    });

    req.io.to(`order_${id}`).emit("order_status_updated", { status });

    console.log("Socket emitted status:", status);

    res.json(updatedOrder);
  } catch (error) {
    console.error("Order status update failed:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
});

export default router;
