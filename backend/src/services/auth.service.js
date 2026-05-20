import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { userRepository } from "../repositories/user.repository.js";
import { tokenRepository } from "../repositories/token.repository.js";
import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";
import { sendResetEmail } from "../lib/mailer.js";

export const authService = {
  register: async ({ email, password, name }) => {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError("Email already exists", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userRepository.create({
      email,
      password: hashedPassword,
      name,
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
    
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await tokenRepository.createRefreshToken(user.id, refreshToken, refreshTokenExpiresAt);

    return {
      message: "User created!",
      userId: user.id,
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    };
  },

  login: async ({ email, password }) => {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", 401);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
    
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await tokenRepository.createRefreshToken(user.id, refreshToken, refreshTokenExpiresAt);

    return {
      message: "Logged in successfully",
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  },

  refreshAuthToken: async (refreshTokenStr) => {
    if (!refreshTokenStr) {
      throw new AppError("Refresh token is required", 401);
    }
    
    const tokenDoc = await tokenRepository.findRefreshToken(refreshTokenStr);
    
    if (!tokenDoc) {
      throw new AppError("Invalid refresh token", 401);
    }
    
    if (tokenDoc.revokedAt || new Date() > tokenDoc.expiresAt) {
      throw new AppError("Refresh token expired or revoked", 401);
    }
    
    const user = tokenDoc.user;
    
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
    
    return { token: newAccessToken };
  },

  forgotPassword: async (email) => {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Don't leak user existence
      return { message: "If that email exists, a reset link has been sent." };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await userRepository.updateResetToken(email, hashedToken, tokenExpiry);
    
    // Using mailer instead of returning the URL (Fixes Phase 2 Critical Issue)
    await sendResetEmail(user.email, resetToken);

    return {
      message: "If that email exists, a reset link has been sent."
    };
  },

  resetPassword: async (token, password) => {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await userRepository.findByValidResetToken(hashedToken);

    if (!user) {
      throw new AppError("Token is invalid or has expired", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await userRepository.updatePasswordAndClearToken(user.id, hashedPassword);

    return { message: "Password has been successfully restored." };
  },

  getAllUsers: async (page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    return userRepository.findAll(skip, Number(limit));
  },

  updateUserRole: async (id, role) => {
    if (!["USER", "ADMIN", "RIDER"].includes(role)) {
      throw new AppError("Invalid role", 400);
    }
    return userRepository.updateRole(id, role);
  }
};
