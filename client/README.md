# BusinessOS (frontend)

Next.js frontend for BusinessOS, wired to the companion Express + Prisma + Neon API (`businessos-api`) for authentication, multi-tenant organizations, and every business module.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Recharts**, **next-themes**, and **better-auth**'s React client, in a white + dark-green enterprise theme with full light/dark support.

## 1. Run the backend first

This app has no data of its own — it's a client for `businessos-api`. Follow that project's README to get it running against Neon (`npm install`, `npm run prisma:migrate`, `npm run dev`), then come back here.

## 2. Configure and run the frontend

```bash
cp .env.local.example .env.local   # point NEXT_PUBLIC_API_URL at your backend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll land on `/sign-in` until you're authenticated.

**Important:** the backend's `CLIENT_ORIGIN` env var must match this app's origin exactly (e.g. `http://localhost:3000`), or the session cookie set by better-auth won't be sent on cross-origin requests.

## First-run flow

1. **Sign up** (`/sign-up`) — creates a user via `POST /api/auth/sign-up/email`.
2. **Create your company** (`/onboarding`) — every new account has no organization yet, so this is unskippable. It calls `POST /api/v1/onboarding/company`, then `authClient.organization.setActive(...)` to sync the session.
3. **Dashboard** — from here on, `AuthGuard` (see below) keeps you inside the app as long as you have a session **and** an active organization.

Everything after this point is driven by real HTTP requests — there is no mock data left in the app except the AI Assistant's example prompts (see below).

## Folder structure

```
app/
  layout.tsx                Root layout — fonts + ThemeProvider + ToastProvider only
  page.tsx                  Redirects "/" to "/dashboard"
  sign-in/page.tsx           better-auth email/password sign-in
  sign-up/page.tsx           better-auth email/password sign-up
  onboarding/page.tsx        "Create Company" step (POST /api/v1/onboarding/company)
  (app)/                     Route group for everything behind auth
    layout.tsx                Wraps children in <AuthGuard><AppShell>
    dashboard/ employees/ customers/ suppliers/ products/ inventory/
    sales/ purchases/ reports/ notifications/ ai-assistant/ settings/
    future/[slug]/            Roadmap placeholder pages (unchanged, static)

components/
  auth/                      AuthGuard (session + org redirect logic), AuthLayout
  layout/                    Sidebar, Topbar, CommandPalette (⌘K — hits the real search
                             endpoints), AppShell
  ui/                        Card, Badge, Button, KpiCard, DataTable (now backend-aware:
                             create/delete wired to real endpoints), CreateModal
                             (generic quick-add form), SlideOver, EmptyState, Toast, …
  dashboard/                 Recharts components, now prop-driven from /dashboard/overview
  sales/NewSaleModal.tsx      Multi-line-item invoice creation
  purchases/NewPurchaseModal.tsx  Multi-line-item purchase order creation
  ai/ChatPanel.tsx            Answers canned prompts using real data (see below)
  theme-provider.tsx         next-themes wrapper

lib/
  env.ts                     NEXT_PUBLIC_API_URL
  api.ts                     Typed fetch wrapper for /api/v1/* (credentials: "include")
  auth-client.ts             better-auth React client (sign in/up/out, organization plugin)
  queries.ts                 One typed function per backend endpoint — this is the whole
                             data layer; every page imports from here
  useApi.ts                  Tiny { data, loading, error, refetch } hook used by every page
  types.ts                   Types mirroring the backend's Prisma models
  format.ts                  Currency formatting, status badge styles, stock-status logic
  nav.ts                     Sidebar navigation config + page metadata

middleware.ts                 Edge redirect based on session-cookie presence (fast path;
                              AuthGuard is still the source of truth client-side)
```

## How auth works end-to-end

- `lib/auth-client.ts` creates a better-auth client pointed at `${NEXT_PUBLIC_API_URL}/api/auth`, with the `organizationClient` plugin.
- `middleware.ts` does a cheap, edge-safe check for the session cookie's presence and redirects `/sign-in` ↔ `/dashboard` before the page even renders — this is a UX optimization, not real authorization.
- `components/auth/AuthGuard.tsx` (client component, wraps everything under `(app)/layout.tsx`) uses `useSession()` and `useActiveOrganization()` to enforce the real rule: no session → `/sign-in`; session but no active org → `/onboarding`.
- Every API call goes through `lib/api.ts`'s `fetch(..., { credentials: "include" })`, so the better-auth session cookie rides along automatically. There's no manual token handling anywhere in the app.
- Inviting teammates (`Settings` page) calls `authClient.organization.inviteMember(...)` directly — that's a better-auth endpoint, not a custom one, so acceptance/expiry/etc. are handled by the library.

## Data layer

`lib/queries.ts` is the single place every page calls into — e.g. `listEmployees()`, `createProduct(...)`, `receivePurchase(id)`. Pages call these through `useApi()`:

```tsx
const { data, loading, error, refetch } = useApi(() => listEmployees(), []);
```

`DataTable` (used by Employees/Customers/Suppliers/Products/Sales/Purchases) now takes optional `createFields` + `onCreate` and `onDelete` props — pass them and the table renders a real "Add" button backed by `CreateModal`, and a working delete action; omit them and the table is read-only. Sales and Purchases use dedicated modals (`NewSaleModal`, `NewPurchaseModal`) instead, since creating an invoice or PO needs a repeatable line-items UI that the generic modal doesn't support.

## Known gaps / where mock behavior remains

- **Customers** has no dedicated backend model (the schema only stores `customerName`/`customerPhone` inline on `Sale`), so that page derives a customer list by aggregating `GET /sales` client-side. It's real data, just computed rather than fetched directly.
- **AI Assistant** has no LLM on the backend. `components/ai/ChatPanel.tsx` answers the five example prompts by calling the real dashboard/sales endpoints and formatting the response — genuinely your data, just pattern-matched rather than model-generated. Anything else typed in gets a generic real-data snapshot.
- **Reports** export buttons (PDF/Excel/CSV) still just show a toast — there's no export endpoint on the backend yet.
- **Detail-panel "Edit"** was removed in favor of dedicated create forms + delete; wiring full edit-in-place forms per entity is the next logical step if you want it (the backend's `PATCH` endpoints are already there and documented in the API's README).

## Design system

Unchanged from the original build: brand green scale (`brand-50` → `brand-900`, anchored on `#0F4C3A` / `#147A52`) plus white, Manrope for headings, Inter for body/data, `next-themes` class-strategy dark mode, and a sidebar that collapses to an off-canvas drawer below `md`.
