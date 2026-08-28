import type { Request } from "express";
import { prisma } from "./prisma";
import type { Prisma, PrismaClient } from "../../generated/prisma";

interface AuditInput {
  organizationId: string;
  userId?: string | null;
  action: string; // e.g. "sale.created", "employee.updated"
  resource: string; // e.g. "Sale", "Employee"
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Writes an AuditLog row. Accepts an optional Prisma transaction client so it
 * can participate in the same transaction as the business mutation it's
 * recording (sale creation, inventory adjustment, etc).
 */
export async function writeAuditLog(
  input: AuditInput,
  client: PrismaClient | Prisma.TransactionClient = prisma
) {
  await client.auditLog.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId ?? null,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId ?? null,
      metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}

/** Convenience wrapper that pulls org/user/IP/user-agent off the request. */
export function auditFromRequest(req: Request) {
  return (
    action: string,
    resource: string,
    resourceId?: string | null,
    metadata?: Record<string, unknown>,
    client?: PrismaClient | Prisma.TransactionClient
  ) =>
    writeAuditLog(
      {
        organizationId: req.organizationId!,
        userId: req.user?.id ?? null,
        action,
        resource,
        resourceId,
        metadata,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
      client
    );
}
