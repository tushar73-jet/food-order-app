import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { env } from "../config/env.js";

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

router.post("/register", validate(RegisterSchema), async (req, res) => {
  const { email, password, name } = req.validated.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Please provide email and password" });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    res.status(201).json({
      message: "User created!",
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error during registration", details: error.message });
  }
});

router.post("/login", validate(LoginSchema), async (req, res) => {
  const { email, password } = req.validated.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    res.json({
      message: "Logged in successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login", details: error.message });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return 200 anyway to prevent email enumeration attacks
      return res.status(200).json({ message: "If that email exists, a reset link has been sent." });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Token expires in 1 hour
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: tokenExpiry,
      },
    });

    // In a real app we email this. Here we just return it so it can be copied from the UI for demo.
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    // Send it to the client purely for developer demo purposes (Not safe for prod)
    res.json({
      message: "Password reset link generated successfully.",
      resetUrl
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Server error during password reset" });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // Hash token to compare with DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { gte: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Token is invalid or has expired" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    res.json({ message: "Password has been successfully restored." });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Server error during password reset" });
  }
});

// Admin: Get all users
router.get("/users", protect, admin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      // Removed non-existent createdAt to avoid 500 error
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Admin: Update user role
router.put("/users/:id/role", protect, admin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!["USER", "ADMIN", "RIDER"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: "Failed to update user role" });
  }
});

export default router;