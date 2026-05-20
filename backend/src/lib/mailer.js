import { logger } from "./logger.js";

export const sendResetEmail = async (email, resetToken) => {
  const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
  logger.info(`[MAILER MOCK] Sending password reset email to ${email}`);
  logger.info(`[MAILER MOCK] Reset Link: ${resetUrl}`);
};

export const sendOrderPlacedEmail = async (email, orderId) => {
  logger.info(`[MAILER MOCK] Sending order confirmation email to ${email} for order #${orderId}`);
};

export const sendOrderStatusEmail = async (email, orderId, status) => {
  logger.info(`[MAILER MOCK] Sending order status update to ${email}: Order #${orderId} is now ${status}`);
};
