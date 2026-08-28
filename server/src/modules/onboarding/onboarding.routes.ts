import { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { writeAuditLog } from "../../lib/audit";
import { env } from "../../config/env";

export const onboardingRouter = Router();

function hashToken(raw: string) {
  return crypto.createHmac("sha256", env.ONBOARDING_TOKEN_SALT).update(raw).digest("hex");
}

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || crypto.randomUUID().slice(0, 8)
  );
}

const DEFAULT_DEPARTMENTS = ["Sales", "Warehouse", "Finance", "Operations"];

/**
 * POST /onboarding/tokens — generate a beta/invite token that gates company
 * creation (see `company.token` below). Useful if BusinessOS is rolled out
 * to new businesses by invitation only; harmless to leave open otherwise
 * since `company` creation doesn't require a token unless
 * REQUIRE_ONBOARDING_TOKEN=true.
 */
onboardingRouter.post(
  "/tokens",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { expiresInDays } = z.object({ expiresInDays: z.number().min(1).max(90).optional() }).parse(req.body ?? {});
    const rawToken = crypto.randomBytes(24).toString("base64url");

    const token = await prisma.onboardingToken.create({
      data: {
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + (expiresInDays ?? 14) * 24 * 60 * 60 * 1000),
      },
    });

    // The raw token is only ever returned here — only the hash is persisted.
    return created(res, { token: rawToken, expiresAt: token.expiresAt });
  })
);

/** POST /onboarding/validate-token — check a token before showing the "create company" form. */
onboardingRouter.post(
  "/validate-token",
  asyncHandler(async (req, res) => {
    const { token } = z.object({ token: z.string().min(1) }).parse(req.body);

    const record = await prisma.onboardingToken.findFirst({ where: { tokenHash: hashToken(token) } });
    const valid = !!record && !record.usedAt && record.expiresAt > new Date();

    return ok(res, { valid });
  })
);

const createCompanySchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(60).optional(),
  businessType: z.enum([
    "SUPERMARKET",
    "DISTRIBUTOR",
    "WHOLESALER",
    "MANUFACTURING",
    "PHARMACY",
    "LOGISTICS",
    "SCHOOL",
    "HOSPITAL",
    "RESTAURANT",
    "OTHER",
  ]),
  timezone: z.string().max(60).optional(),
  currency: z.string().length(3).optional(),
  dateFormat: z.string().max(20).optional(),
  token: z.string().optional(),
});

/**
 * POST /onboarding/company — the "Create Company" step of first-time
 * onboarding. Requires the user to already be signed up/signed in (via
 * better-auth's own /api/auth/sign-up/email). Creates the Organization
 * (through better-auth so membership/roles stay consistent with the rest of
 * the org plugin), seeds OrganizationSettings + starter Departments, and
 * marks the session's active organization.
 */
onboardingRouter.post(
  "/company",
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = createCompanySchema.parse(req.body);

    if (env.REQUIRE_ONBOARDING_TOKEN) {
      if (!input.token) throw ApiError.badRequest("An onboarding token is required to create a company.");
      const record = await prisma.onboardingToken.findFirst({ where: { tokenHash: hashToken(input.token) } });
      if (!record || record.usedAt || record.expiresAt < new Date()) {
        throw ApiError.badRequest("This onboarding token is invalid, expired, or already used.");
      }
    }

    const slug = slugify(input.slug || input.name);
    const existingSlug = await prisma.organization.findUnique({ where: { slug } });
    if (existingSlug) throw ApiError.conflict("An organization with this name/slug already exists.");

    const result = await auth.api.createOrganization({
      body: {
        name: input.name,
        slug,
        metadata: { businessType: input.businessType },
      },
      headers: fromNodeHeaders(req.headers),
    });

    if (!result) throw ApiError.internal("Failed to create organization.");
    const organizationId = result.id;

    await prisma.$transaction([
      prisma.organizationSettings.create({
        data: {
          organizationId,
          timezone: input.timezone ?? "Africa/Lagos",
          currency: input.currency ?? "NGN",
          dateFormat: input.dateFormat ?? "DD/MM/YYYY",
        },
      }),
      prisma.department.createMany({
        data: DEFAULT_DEPARTMENTS.map((name) => ({ organizationId, name })),
      }),
      prisma.session.update({
        where: { id: req.session!.id },
        data: { activeOrganizationId: organizationId },
      }),
    ]);

    if (env.REQUIRE_ONBOARDING_TOKEN && input.token) {
      await prisma.onboardingToken.updateMany({
        where: { tokenHash: hashToken(input.token) },
        data: { usedAt: new Date() },
      });
    }

    await writeAuditLog({
      organizationId,
      userId: req.user!.id,
      action: "organization.created",
      resource: "Organization",
      resourceId: organizationId,
      metadata: { name: input.name, businessType: input.businessType },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return created(res, { organization: result, organizationId });
  })
);
