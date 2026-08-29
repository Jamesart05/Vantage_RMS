"use client";

import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { API_BASE_URL } from "./env";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    // In the browser: Use the full origin URL (e.g., https://vantage-rms.vercel.app)
    return window.location.origin;
  }
  
  // During SSR / Next.js static prerendering: Fallback to production URL
  return process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://vantage-rms-backend.onrender.com";
}

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [organizationClient()],
});

export const { useSession, signIn, signUp, signOut, organization, useListOrganizations, useActiveOrganization } =
  authClient;
