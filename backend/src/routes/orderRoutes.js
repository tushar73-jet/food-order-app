import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { protect, admin, rider } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { env } from "../config/env.js";

const router = express.Router();

let razorpay;
if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

const ItemsSchema = z
  .array(
    z
      .object({
        productId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().positive().max(50),
      })
      .strict()
  )
  .min(1);

const CreateOrderSchema = z.object({
  body: z
    .object({
      items: ItemsSchema,
    })
    .strict(),
});

const VerifyPaymentSchema = z.object({
  body: z
    .object({
      razorpay_order_id: z.string().min(1),
      razorpay_payment_id: z.string().min(1),
      razorpay_signature: z.string().min(1),
      items: ItemsSchema,
    })
    .strict(),
});

router.post("/create-order", protect, validate(CreateOrderSchema), async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({
      error: "Payment service not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables."
    });
  }

  const { items } = req.validated.body;

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
      keyId: env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ error: "Failed to create payment order due to invalid Razorpay Keys." });
  }
});

router.post("/verify-payment", protect, validate(VerifyPaymentSchema), async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({
      error: "Payment service not configured."
    });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items } =
    req.validated.body;

  try {
    if (razorpay_payment_id === "MOBILE_TEST_PAYMENT" && razorpay_signature === "MOBILE_TEST_SIG") {
      if (!env.ALLOW_DEMO_PAYMENTS) {
        return res.status(403).json({ error: "Demo payments are disabled in this environment." });
      }
      // Continue to create order since demo mode is allowed
    } else {
      // Normal Razorpay verification logic
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const generated_signature = crypto
        .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest("hex");

      if (generated_signature !== razorpay_signature) {
        return res.status(400).json({ error: "Invalid payment signature" });
      }

      // Verify payment with Razorpay (defense-in-depth)
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
         if (!product) throw new Error(`Product ${item.productId} not found`);
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

// Razorpay Webhook (server-to-server). Do NOT put this behind JWT auth.
// Requires RAZORPAY_WEBHOOK_SECRET.
router.post(
  "/razorpay/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    if (!env.RAZORPAY_WEBHOOK_SECRET) {
      return res.status(503).json({ error: "Webhook not configured" });
    }

    const signature = req.headers["x-razorpay-signature"];
    if (typeof signature !== "string") {
      return res.status(400).json({ error: "Missing signature" });
    }

    const expected = crypto
      .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body)
      .digest("hex");

    if (expected !== signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    // At this point the webhook is authentic. You can parse and persist events here.
    // We acknowledge immediately to avoid retries/timeouts.
    return res.status(200).json({ received: true });
  }
);

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

// Rider: Get live orders assigned to them (or all active for demo)
router.get("/rider/active", protect, rider, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: "OUT_FOR_DELIVERY", // Strict filter for riders
      },
      include: {
        user: {
           select: { name: true, email: true }
        },
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
    res.status(500).json({ error: "Failed to load active deliveries" });
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
