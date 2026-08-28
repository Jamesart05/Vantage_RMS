import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required (Neon pooled connection string)"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required (Neon direct connection string, for migrations)"),

  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().url(),

  CLIENT_ORIGIN: z.string().min(1).default("http://localhost:3000"),

  ONBOARDING_TOKEN_SALT: z.string().min(16).default("businessos-onboarding-salt"),
  REQUIRE_ONBOARDING_TOKEN: z.coerce.boolean().default(false),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

// CLIENT_ORIGIN may be a comma-separated list of allowed origins.
export const trustedOrigins = env.CLIENT_ORIGIN.split(",").map((o) => o.trim());
