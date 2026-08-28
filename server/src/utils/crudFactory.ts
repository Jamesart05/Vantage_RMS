import type { Request, Response } from "express";
import type { ZodSchema } from "zod";
import { prisma } from "../lib/prisma";
import { ApiError } from "./ApiError";
import { ok, created, noContent } from "./ApiResponse";
import { asyncHandler } from "./asyncHandler";
import { getPagination, buildMeta, getSort } from "./pagination";
import { auditFromRequest } from "../lib/audit";

// A minimal shape covering the subset of Prisma delegate methods we call.
// `any` is used deliberately here (not `unknown`): Prisma's real delegate
// types are strict function types under specific args unions per-model, and
// TypeScript's contravariant parameter checking makes a single shared
// interface impossible to satisfy across differently-shaped models without
// loosening the parameter type. Call sites cast concrete delegates
// (`prisma.employee`, etc.) to `Delegate` when wiring up each module.
/* eslint-disable @typescript-eslint/no-explicit-any */
interface Delegate {
  findMany: (args: any) => Promise<any[]>;
  count: (args: any) => Promise<number>;
  findFirst: (args: any) => Promise<any>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface CrudOptions<TCreate, TUpdate> {
  /** Human-readable resource name used in audit logs, e.g. "Employee". */
  resourceName: string;
  /** Prisma delegate, e.g. () => prisma.employee */
  delegate: () => Delegate;
  createSchema: ZodSchema<TCreate>;
  updateSchema: ZodSchema<TUpdate>;
  /** Fields eligible for `sort=field:asc|desc`. */
  sortableFields: string[];
  /** Default sort when none/invalid is provided. */
  defaultSort: Record<string, "asc" | "desc">;
  /** Build a Prisma `where` clause fragment from `?search=` (case-insensitive). */
  searchWhere?: (search: string) => Record<string, unknown>;
  /** Extra `where` filters derived from query params, e.g. ?status=ACTIVE. */
  filterWhere?: (req: Request) => Record<string, unknown>;
  /** Relations to include on list/detail responses. */
  include?: Record<string, unknown>;
  /** Transform the validated create payload before writing (e.g. computed fields). */
  beforeCreate?: (data: TCreate, req: Request) => Record<string, unknown> | Promise<Record<string, unknown>>;
  /** Transform the validated update payload before writing. */
  beforeUpdate?: (data: TUpdate, req: Request, existing: unknown) => Record<string, unknown> | Promise<Record<string, unknown>>;
  /** Run extra logic (e.g. related-row creation) right after create, same request cycle. */
  afterCreate?: (record: unknown, req: Request) => Promise<void>;
  /** Block deletes conditionally (e.g. "can't delete a product with sales history"). */
  beforeDelete?: (existing: unknown, req: Request) => Promise<void>;
}

export function createCrudController<TCreate, TUpdate>(opts: CrudOptions<TCreate, TUpdate>) {
  const audit = (req: Request) => auditFromRequest(req);

  const list = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, skip, take } = getPagination(req);
    const orderBy = getSort(req, opts.sortableFields, opts.defaultSort);

    const where: Record<string, unknown> = {
      organizationId: req.organizationId,
      ...(opts.filterWhere ? opts.filterWhere(req) : {}),
    };

    const search = String(req.query.search ?? "").trim();
    if (search && opts.searchWhere) {
      Object.assign(where, opts.searchWhere(search));
    }

    const [rows, total] = await Promise.all([
      opts.delegate().findMany({ where, orderBy, skip, take, include: opts.include }),
      opts.delegate().count({ where }),
    ]);

    return ok(res, rows, buildMeta(page, pageSize, total));
  });

  const getOne = asyncHandler(async (req: Request, res: Response) => {
    const row = await opts.delegate().findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
      include: opts.include,
    });
    if (!row) throw ApiError.notFound(`${opts.resourceName} not found.`);
    return ok(res, row);
  });

  const create = asyncHandler(async (req: Request, res: Response) => {
    const parsed = opts.createSchema.parse(req.body);
    const extra = opts.beforeCreate ? await opts.beforeCreate(parsed, req) : {};

    const row = await opts.delegate().create({
      data: { ...(parsed as object), ...extra, organizationId: req.organizationId },
      include: opts.include,
    });

    if (opts.afterCreate) await opts.afterCreate(row, req);

    await audit(req)(`${opts.resourceName.toLowerCase()}.created`, opts.resourceName, (row as { id: string }).id, {
      input: parsed,
    });

    return created(res, row);
  });

  const update = asyncHandler(async (req: Request, res: Response) => {
    const existing = await opts.delegate().findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
    });
    if (!existing) throw ApiError.notFound(`${opts.resourceName} not found.`);

    const parsed = opts.updateSchema.parse(req.body);
    const extra = opts.beforeUpdate ? await opts.beforeUpdate(parsed, req, existing) : {};

    const row = await opts.delegate().update({
      where: { id: req.params.id },
      data: { ...(parsed as object), ...extra },
      include: opts.include,
    });

    await audit(req)(`${opts.resourceName.toLowerCase()}.updated`, opts.resourceName, req.params.id, { input: parsed });

    return ok(res, row);
  });

  const remove = asyncHandler(async (req: Request, res: Response) => {
    const existing = await opts.delegate().findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
    });
    if (!existing) throw ApiError.notFound(`${opts.resourceName} not found.`);

    if (opts.beforeDelete) await opts.beforeDelete(existing, req);

    await opts.delegate().delete({ where: { id: req.params.id } });

    await audit(req)(`${opts.resourceName.toLowerCase()}.deleted`, opts.resourceName, req.params.id);

    return noContent(res);
  });

  return { list, getOne, create, update, remove };
}
