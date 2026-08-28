import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

// Prisma's generated client exposes these error classes at runtime even
// though we avoid importing PrismaClientKnownRequestError's type directly
// here, to keep this file decoupled from the generated client location.
interface PrismaKnownError extends Error {
  code: string;
  meta?: Record<string, unknown>;
}

function isPrismaKnownError(err: unknown): err is PrismaKnownError {
  return !!err && typeof err === "object" && "code" in err && typeof (err as { code: unknown }).code === "string" && /^P\d{4}$/.test((err as { code: string }).code);
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, error: { message: `Route not found: ${req.method} ${req.originalUrl}` } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, details: err.details },
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: { message: "Validation failed", details: err.flatten() },
    });
  }

  if (isPrismaKnownError(err)) {
    const map: Record<string, { status: number; message: string }> = {
      P2002: { status: 409, message: "A record with this value already exists." },
      P2003: { status: 400, message: "Related record not found (foreign key constraint failed)." },
      P2025: { status: 404, message: "Record not found." },
    };
    const mapped = map[err.code] ?? { status: 400, message: "Database request error." };
    return res.status(mapped.status).json({
      success: false,
      error: { message: mapped.message, code: err.code, ...(env.NODE_ENV !== "production" ? { meta: err.meta } : {}) },
    });
  }

  console.error("[unhandled error]", err);
  return res.status(500).json({
    success: false,
    error: {
      message: "Something went wrong.",
      ...(env.NODE_ENV !== "production" && err instanceof Error ? { stack: err.stack } : {}),
    },
  });
}
