import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { apiRouter } from "./routes/index";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";
import { env, trustedOrigins } from "./config/env";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: ["https://vantage-rms.vercel.app", "http://localhost:3000"],

      credentials: true,
    }),
  );
  app.use(helmet());
  app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

  // better-auth's handler needs the raw (un-parsed) request, so it's
  // mounted BEFORE express.json(). It owns everything under /api/auth/*:
  // sign-up, sign-in, sessions, and the organization plugin's own
  // invite/accept/list-members endpoints.
  app.all("/api/auth/*", toNodeHandler(auth));

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) =>
    res.json({ status: "ok", timestamp: new Date().toISOString() }),
  );

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
