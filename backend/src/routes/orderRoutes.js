import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import prisma from "../lib/prisma.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Initialize Razorpay with error handling
let razorpay;
try {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn("⚠️  Razorpay keys not found. Payment features will not work.");
  } else {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
} catch (error) {
  console.error("Failed to initialize Razorpay:", error);
}


router.post("/create-order", protect, async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ 
      error: "Payment service not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables." 
    });
  }

  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    const options = {
      amount: Math.round(parseFloat(amount) * 100), // Convert to paise (Razorpay uses smallest currency unit)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.userId.toString(),
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.json({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    res.status(500).json({ error: "Failed to create payment order: " + error.message });
  }
});

router.post("/verify-payment", protect, async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ 
      error: "Payment service not configured." 
    });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, totalPrice } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !items || items.length === 0) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Verify payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Verify payment with Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status !== "captured" && payment.status !== "authorized") {
      return res.status(400).json({ error: "Payment not completed" });
    }

    // Create order with payment info
    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: req.userId,
          totalPrice: parseFloat(totalPrice),
          paymentId: razorpay_payment_id,
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
    console.error("Payment verification and order creation failed:", error);
    res.status(500).json({ error: "Failed to verify payment and create order: " + error.message });
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
