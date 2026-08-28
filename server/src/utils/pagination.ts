import type { Request } from "express";

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

export function getPagination(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const rawPageSize = parseInt(String(req.query.pageSize ?? DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, rawPageSize));

  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function buildMeta(page: number, pageSize: number, total: number) {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Parses `sort=field:asc` / `sort=field:desc` into a Prisma orderBy object. */
export function getSort(req: Request, allowedFields: string[], fallback: Record<string, "asc" | "desc">) {
  const raw = String(req.query.sort ?? "");
  const [field, dir] = raw.split(":");
  if (field && allowedFields.includes(field)) {
    return { [field]: dir === "desc" ? "desc" : "asc" } as Record<string, "asc" | "desc">;
  }
  return fallback;
}
