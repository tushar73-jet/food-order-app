import express from "express";
import { z } from "zod";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { cartController } from "../controllers/cart.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

const SyncCartSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      id: z.coerce.number().int().positive(),
      quantity: z.coerce.number().int().positive().max(100),
    })).optional().default([]),
  }).strict(),
});

router.get("/", protect, asyncHandler(cartController.getCart));
router.post("/", protect, validate(SyncCartSchema), asyncHandler(cartController.syncCart));
router.delete("/", protect, asyncHandler(cartController.clearCart));

export default router;
