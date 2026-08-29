"use client";

import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { API_BASE_URL } from "./env";

export const authClient = createAuthClient({
  baseURL: `${API_BASE_URL}/api/auth` || (typeof window !== "undefined" ? window.location.origin : "https://vantage-rms-backend.onrender.com"),
  plugins: [organizationClient()],
});

export const { useSession, signIn, signUp, signOut, organization, useListOrganizations, useActiveOrganization } =
  authClient;
