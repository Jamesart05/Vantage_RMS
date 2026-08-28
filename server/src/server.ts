import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";

async function main() {
  await prisma.$connect();
  console.log("✅ Connected to the database.");

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 BusinessOS API listening on http://localhost:${env.PORT}`);
    console.log(`   Auth endpoints:   http://localhost:${env.PORT}/api/auth/*`);
    console.log(`   Business API:     http://localhost:${env.PORT}/api/v1/*`);
  });

  async function shutdown(signal: string) {
    console.log(`\n${signal} received — shutting down gracefully…`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
