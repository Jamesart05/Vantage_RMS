// NEXT_PUBLIC_* vars are inlined at build time and safe to reference from
// client components. Falls back to the local API dev server if unset.
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
