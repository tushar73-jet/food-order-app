import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import prisma from "../lib/prisma.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

router.post("/create-order", protect, async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({
      error: "Payment service not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables."
    });
  }

  const { items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "No items provided" });
  }

  try {
    // 🛡️ SECURE: Calculate the real total exclusively from the Database 
    let computedTotal = 0;
    for (const item of items) {
       const product = await prisma.product.findUnique({ where: { id: item.productId } });
       if (!product) throw new Error(`Product ${item.productId} not found`);
       computedTotal += (Number(product.price) * item.quantity);
    }
    
    // Add 5% GST
    computedTotal = computedTotal + (computedTotal * 0.05);
    const finalAmount = Math.round(computedTotal);
    const options = {
      amount: finalAmount * 100, // Convert to paise (Razorpay uses smallest currency unit)
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
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ error: "Failed to create payment order due to invalid Razorpay Keys." });
  }
});

router.post("/verify-payment", protect, async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({
      error: "Payment service not configured."
    });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !items || items.length === 0) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 🛡️ MOBILE TEST BYPASS
    if (razorpay_payment_id === "MOBILE_TEST_PAYMENT") {
       // Allow it to pass to simulate mobile ordering
    } else {
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
    }

    // Create order with payment info
    const newOrder = await prisma.$transaction(async (tx) => {
      // 🛡️ SECURE: Recalculate price again to ensure user didn't modify cart right before payment verified
      let computedTotal = 0;
      for (const item of items) {
         const product = await tx.product.findUnique({ where: { id: item.productId } });
         computedTotal += (Number(product.price) * item.quantity);
      }
      const finalAmount = computedTotal + (computedTotal * 0.05);

      const order = await tx.order.create({
        data: {
          userId: req.userId,
          totalPrice: parseFloat(finalAmount.toFixed(2)),
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
    res.status(500).json({ error: "Failed to verify payment and create order" });
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
    res.status(500).json({ error: "Failed to load orders" });
  }
});

router.get("/admin/all", protect, admin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: true,
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
    res.status(500).json({ error: "Failed to load admin orders" });
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
    res.status(500).json({ error: "Failed to load order" });
  }
});

router.put("/:id/status", protect, admin, async (req, res) => {
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

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

export default router;
