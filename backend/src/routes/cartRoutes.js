import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { cartController } from "../controllers/cart.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/", protect, asyncHandler(cartController.getCart));
router.post("/", protect, asyncHandler(cartController.syncCart));
router.delete("/", protect, asyncHandler(cartController.clearCart));

export default router;
