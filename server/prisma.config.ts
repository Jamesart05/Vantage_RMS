import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * As of Prisma ORM 7, connection URLs no longer live in schema.prisma — the
 * CLI (migrate, studio, db push, generate) reads them from here instead.
 *
 * The running app never reads this file. It connects at runtime through the
 * Neon driver adapter configured in src/lib/prisma.ts, using DATABASE_URL
 * (the pooled connection). This file's `url` is what migrations run
 * against, so it should be the DIRECT (unpooled) connection string — the
 * same one that used to go in schema.prisma's `directUrl`.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
