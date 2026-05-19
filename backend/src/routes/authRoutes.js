import express from "express";
import { z } from "zod";
import { protect, admin } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { ROLES } from "../utils/constants.js";
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

const UpdateRoleSchema = z.object({
  body: z.object({
    role: z.enum(Object.values(ROLES)),
  }).strict(),
});

router.post("/register", authLimiter, validate(RegisterSchema), asyncHandler(authController.register));
router.post("/login", authLimiter, validate(LoginSchema), asyncHandler(authController.login));
router.post("/refresh", asyncHandler(authController.refreshToken));
router.post("/forgot-password", authLimiter, asyncHandler(authController.forgotPassword));
router.post("/reset-password/:token", authLimiter, asyncHandler(authController.resetPassword));

// Admin routes
router.get("/users", protect, admin, asyncHandler(authController.getAllUsers));
router.put("/users/:id/role", protect, admin, validate(UpdateRoleSchema), asyncHandler(authController.updateUserRole));

export default router;