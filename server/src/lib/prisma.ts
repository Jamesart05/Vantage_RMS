import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../../generated/prisma/client";
import { env } from "../config/env";

// @prisma/adapter-neon bundles the Neon serverless driver and its
// WebSocket handling internally as of Prisma 7 — no separate
// `@neondatabase/serverless` / `ws` setup needed.
const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL });

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Reuse the client across hot-reloads in dev to avoid exhausting connections.
export const prisma =
  global.__prisma ??
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (env.NODE_ENV === "development") {
  global.__prisma = prisma;
}
