import dotenv from "dotenv";
import { z } from "zod";

// Ensure .env is loaded even in ESM import order scenarios.
dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional().default("development"),
  PORT: z.coerce.number().int().positive().optional(),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().min(1).optional().default("7d"),
  CORS_ORIGINS: z.string().optional(), // comma-separated list; if unset we fall back to request origin in dev only

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  ALLOW_DEMO_PAYMENTS: z.preprocess((val) => val === "true" || val === true, z.boolean()).optional().default(false),
});

export const env = (() => {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((i) => `${i.path.join(".") || "env"}: ${i.message}`)
      .join("\n");
    // Fail fast: production should never boot with invalid env.
    throw new Error(`Invalid environment variables:\n${message}`);
  }
  const value = parsed.data;
  if (value.NODE_ENV === "production" && value.JWT_SECRET.length < 32) {
    throw new Error("Invalid environment variables:\nJWT_SECRET: JWT_SECRET must be at least 32 characters");
  }
  return value;
})();

