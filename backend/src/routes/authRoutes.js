import express from "express";
import { z } from "zod";
import { protect, admin } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { authController } from "../controllers/auth.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

const RegisterSchema = z.object({
  body: z
    .object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(1).max(120).optional(),
    })
    .strict(),
});

const LoginSchema = z.object({
  body: z
    .object({
      email: z.string().email(),
      password: z.string().min(1),
    })
    .strict(),
});

router.post("/register", validate(RegisterSchema), asyncHandler(authController.register));
router.post("/login", validate(LoginSchema), asyncHandler(authController.login));
router.post("/forgot-password", asyncHandler(authController.forgotPassword));
router.post("/reset-password/:token", asyncHandler(authController.resetPassword));

// Admin routes
router.get("/users", protect, admin, asyncHandler(authController.getAllUsers));
router.put("/users/:id/role", protect, admin, asyncHandler(authController.updateUserRole));

export default router;