import express from "express";
import { z } from "zod";
import { protect, admin, rider } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { orderController } from "../controllers/order.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ORDER_STATUS } from "../utils/constants.js";

const router = express.Router();

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
      deliveryAddress: z.string().min(5),
      contactNumber: z.string().min(10),
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
      deliveryAddress: z.string().min(5),
      contactNumber: z.string().min(10),
    })
    .strict(),
});

router.post("/create-order", protect, validate(CreateOrderSchema), asyncHandler(orderController.createOrder));
router.post("/verify-payment", protect, validate(VerifyPaymentSchema), asyncHandler(orderController.verifyPayment));

// Razorpay Webhook (server-to-server)
router.post(
  "/razorpay/webhook",
  express.raw({ type: "application/json" }),
  asyncHandler(async (req, res) => {
    orderController.razorpayWebhook(req, res);
  })
);

router.get("/my-orders", protect, asyncHandler(orderController.getMyOrders));
router.get("/rider/active", protect, rider, asyncHandler(orderController.getRiderActiveOrders));
router.get("/admin/all", protect, admin, asyncHandler(orderController.getAllAdminOrders));
router.get("/:id", protect, asyncHandler(orderController.getOrderById));
const UpdateStatusSchema = z.object({
  body: z.object({
    status: z.enum(Object.values(ORDER_STATUS)),
  }).strict(),
});

router.put("/:id/status", protect, rider, validate(UpdateStatusSchema), asyncHandler(orderController.updateOrderStatus));

export default router;
