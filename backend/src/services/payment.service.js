import Razorpay from "razorpay";
import crypto from "crypto";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

let razorpay;
if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

export const paymentService = {
  createRazorpayOrder: async (finalAmount, userId) => {
    if (!razorpay) {
      throw new AppError("Payment service not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.", 503);
    }

    const options = {
      amount: finalAmount * 100, // paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: userId.toString(),
      },
    };

    const order = await razorpay.orders.create(options);
    return {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.RAZORPAY_KEY_ID,
    };
  },

  verifyPaymentSignature: async (orderId, paymentId, signature) => {
    if (!razorpay) {
      throw new AppError("Payment service not configured.", 503);
    }

    if (paymentId === "MOBILE_TEST_PAYMENT" && signature === "MOBILE_TEST_SIG") {
      if (env.NODE_ENV === "production") {
        throw new AppError("Demo payments are strictly disabled in production.", 403);
      }
      if (!env.ALLOW_DEMO_PAYMENTS) {
        throw new AppError("Demo payments are disabled in this environment.", 403);
      }
      return true;
    }

    const text = `${orderId}|${paymentId}`;
    const generated_signature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (generated_signature !== signature) {
      throw new AppError("Invalid payment signature", 400);
    }

    const payment = await razorpay.payments.fetch(paymentId);
    if (payment.status !== "captured" && payment.status !== "authorized") {
      throw new AppError("Payment not completed", 400);
    }

    return true;
  },

  verifyWebhookSignature: (body, signature) => {
    if (!env.RAZORPAY_WEBHOOK_SECRET) {
      throw new AppError("Webhook not configured", 503);
    }

    if (typeof signature !== "string") {
      throw new AppError("Missing signature", 400);
    }

    const expected = crypto
      .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== signature) {
      throw new AppError("Invalid signature", 400);
    }
    
    return true;
  }
};
