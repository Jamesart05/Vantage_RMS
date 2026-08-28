# BusinessOS API

Express + Prisma backend for BusinessOS, deployed against a [Neon](https://neon.tech) Postgres database. Auth and multi-tenant organizations are powered by [better-auth](https://www.better-auth.com), **pinned to an exact version (`1.7.2`, not a range)** — better-auth's core database schema (the `user`/`session`/`account`/`verification`/`organization`/`member`/`invitation` tables) has changed in breaking ways between minor versions before (e.g. 1.7 added a required `issuer` column to `account`), and an unpinned `^` range can silently pull in a schema your Prisma models no longer match. **If you ever bump this dependency, regenerate the schema for the auth-related models first:**

```bash
npx auth generate --config src/lib/auth.ts --output /tmp/auth-schema-check.prisma -y
```

then diff that output against the `User`/`Session`/`Account`/`Verification`/`Organization`/`Member`/`Invitation` models in `prisma/schema.prisma` and apply any differences by hand (keeping your own custom fields, like `User.lastActiveAt`). Don't just overwrite the file — it'll also emit a generic `generator`/`datasource` block you don't want, and won't know about your business models at all.

## Stack

- **Express 4** — HTTP layer
- **Prisma ORM 7** (`engineType = "client"`) + **`@prisma/adapter-neon`** — no native Rust query engine binary at runtime; runs anywhere Node does, including serverless. Connection URLs live in `prisma.config.ts`, not `schema.prisma` (that's a Prisma 7 change — see below if you're used to older Prisma versions)
- **better-auth** — email/password auth, sessions, and the **organization plugin** for multi-tenancy (Organization / Member / Invitation), with 7 custom BusinessOS roles
- **Zod** — request validation
- **TypeScript**, compiled with `tsc`; `tsx` for local dev

## 1. Set up Neon

1. Create a project at [neon.tech](https://neon.tech).
2. From the dashboard, copy the **pooled** connection string → `DATABASE_URL`.
3. Copy the **direct** connection string (no `-pooler` in the hostname) → `DIRECT_URL`. Prisma Migrate needs this one because it runs DDL over a direct connection.

## 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Neon **pooled** connection string |
| `DIRECT_URL` | Neon **direct** connection string (migrations only) |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Public URL this API is served from, e.g. `http://localhost:4000` |
| `CLIENT_ORIGIN` | Your frontend's origin(s), comma-separated. Must match exactly (scheme + host + port) for cookies to work. |
| `PORT` | Defaults to `4000` |
| `ONBOARDING_TOKEN_SALT` / `REQUIRE_ONBOARDING_TOKEN` | Only relevant if you want invite-gated company creation — see below |

## 3. Install, generate, migrate

```bash
npm install            # also runs `prisma generate` via postinstall
npm run prisma:migrate  # creates tables in Neon from prisma/schema.prisma
```

> **Prisma 7 note:** connection URLs are configured in **`prisma.config.ts`** at the project root, not in `schema.prisma`'s `datasource` block — Prisma 7 removed the schema-based `url`/`directUrl` properties entirely. `prisma.config.ts` reads `DIRECT_URL` (used by the CLI for migrate/studio/generate); the running app never reads that file and instead connects via the Neon driver adapter in `src/lib/prisma.ts`, using `DATABASE_URL`. Both env vars still need to be set — they're just consumed in two different places now. If you're following an older Prisma 6 tutorial that shows `url = env("DATABASE_URL")` inside `datasource db { ... }`, that syntax will fail validation on this project's Prisma version.

> **Note on `prisma generate`:** this schema uses Prisma's `"prisma-client"` generator with `engineType = "client"`, paired with `@prisma/adapter-neon`. This avoids downloading a native Rust query-engine binary at *runtime*, which is what makes it Neon/serverless-friendly. The `prisma generate`/`prisma migrate` **CLI commands themselves** still fetch a small schema-engine binary from Prisma's CDN the first time you run them in a fresh environment — this just needs normal outbound internet access (it's blocked in some fully air-gapped sandboxes, but works on a normal machine, CI runner, or hosting provider).

## 4. Run it

```bash
npm run dev     # tsx watch — http://localhost:4000
# or
npm run build && npm start
```

Health check: `GET /health`.

## Architecture

```
prisma/schema.prisma        Your data model (models unchanged; datasource has no url —
                            see prisma.config.ts)
prisma.config.ts            Prisma 7 CLI config — connection URL for migrate/studio/generate

src/
  config/env.ts              Zod-validated environment variables
  lib/
    prisma.ts                 Prisma Client wired to the Neon adapter
    auth.ts                   better-auth config (email/password + organization plugin)
    permissions.ts            Access-control statements + the 7 BusinessOS roles
    audit.ts                  AuditLog writer (used by every mutation)
  middleware/
    auth.ts                    requireAuth / requireOrganization / requirePermission
    errorHandler.ts            Central error → JSON mapping (ApiError, Zod, Prisma codes)
  utils/
    crudFactory.ts             Generic paginated CRUD controller used by simple modules
    ApiError.ts / ApiResponse.ts / asyncHandler.ts / pagination.ts
  modules/
    onboarding/                "Create company" flow (+ optional invite tokens)
    organizations/             Current org, org switcher, rename org
    members/                   Roster, role changes, removal (invites go through better-auth itself)
    settings/                  OrganizationSettings (timezone/currency/date format)
    audit/                     Read-only AuditLog feed
    dashboard/                 One aggregated `/overview` endpoint for the dashboard screen
    departments/ employees/    Core HR
    categories/ products/      Catalog (creating a product auto-provisions its InventoryItem)
    inventory/                 Stock levels, low-stock filter, movement history, adjust, transfer
    suppliers/ purchases/      Purchasing (`/purchases/:id/receive` increases stock + books an expense)
    production/                Batch lifecycle: planned → in-progress → completed (adds stock)
    sales/                     Invoices (creates + decrements stock + books income, in one transaction)
    finance/                   Manual income/expense entries + summary
  routes/index.ts              Mounts every module under /api/v1
  app.ts                       Express app: better-auth at /api/auth/*, business API at /api/v1/*
  server.ts                    Entry point
```

## Authentication & organizations

- **Sign up**: `POST /api/auth/sign-up/email` `{ name, email, password }`
- **Sign in**: `POST /api/auth/sign-in/email` `{ email, password }`
- **Sign out**: `POST /api/auth/sign-out`
- **Create a company** (first-time flow): once signed in, `POST /api/v1/onboarding/company` `{ name, businessType, ... }`. This creates the Organization (via better-auth, so the caller becomes its `owner`), seeds `OrganizationSettings` and four starter departments, and makes it your active org.
- **Invite a teammate**: `POST /api/auth/organization/invite-member` `{ email, role, organizationId }` — role must be one of the 7 BusinessOS roles (see below). The invitee accepts with `POST /api/auth/organization/accept-invitation`.
- **Multiple companies**: `GET /api/v1/organizations` lists every org you belong to; `POST /api/v1/organizations/active { organizationId }` switches which one subsequent requests operate on. Every org-scoped request can also pass an explicit `X-Organization-Id` header instead of relying on the session's remembered active org.

better-auth issues an HTTP-only session cookie; the frontend just needs `credentials: "include"` on fetch/XHR calls and a matching `CLIENT_ORIGIN`.

### Roles

Defined in `src/lib/permissions.ts` using better-auth's access-control primitives:

| Role | Summary |
|---|---|
| `owner` | Full access to everything, including org management |
| `admin` | Full business access; can manage members |
| `manager` | Broad read/create/update; few destructive actions |
| `hr` | Full control of employees & departments |
| `accountant` | Owns finance; read/update sales & purchases |
| `storekeeper` | Owns products/inventory/production; can receive purchases |
| `salesManager` | Owns sales; read-only on products/inventory |

Every business route is gated with `requirePermission({ resource: ["action"] })`, checked against the caller's role for the active organization — no DB round-trip, since the role's permission set is evaluated in memory.

## API conventions

- All business endpoints live under `/api/v1` and require `requireAuth` + `requireOrganization` (a valid session **and** membership in the resolved organization).
- List endpoints support `?page=`, `?pageSize=` (max 100), `?search=`, `?sort=field:asc|desc`, and resource-specific filters (e.g. `?status=`).
- Responses: `{ success: true, data, meta? }` on success, `{ success: false, error: { message, details? } }` on failure.
- Every create/update/delete/action writes a row to `AuditLog`, readable via `GET /api/v1/audit-logs` (owner/admin only by default).

## Notable business logic

- **Products → Inventory**: creating a product auto-creates its `InventoryItem` (optionally seeded with `openingQuantity`/`reorderLevel` in the same request).
- **Sales**: `POST /api/v1/sales` validates stock, computes subtotal/discount/tax/total, creates the `Sale` + `SaleItem`s, decrements inventory, records an `InventoryMovement` per line, and books a `FinancialTransaction` if paid — all in one DB transaction. Cancelling/refunding a sale reverses the stock movement.
- **Purchases**: created as `PENDING`; `POST /api/v1/purchases/:id/receive` is what actually increases stock (and books an expense if already marked paid) — matching the "PO → approval → goods received → inventory increased" flow.
- **Production**: `PLANNED → IN_PROGRESS → COMPLETED`; completing a batch adds its quantity to inventory.
- **Inventory adjustments/transfers**: always paired with an `InventoryMovement` row so every stock change is traceable.

## What you'll want to add next

- Real email delivery for `sendInvitationEmail` in `src/lib/auth.ts` (currently just logs).
- Rate limiting on `/api/auth/*` (better-auth supports this natively — see its docs) before production.
- Tests — none are included yet; the module structure (routes/validation colocated per resource) is written to make them straightforward to add per-module.
