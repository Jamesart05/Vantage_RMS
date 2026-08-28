import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import { prisma } from "./prisma";
import { env, trustedOrigins } from "../config/env";
import { ac, roles } from "./permissions";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins,

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh once per day of activity
    freshAge: 60 * 15,
  },

  plugins: [
    organization({
      ac,
      roles,
      creatorRole: "owner",
      // A brand-new user creates their company through our own
      // /api/v1/onboarding flow (see src/modules/onboarding), not the
      // generic better-auth endpoint, so we can also seed
      // OrganizationSettings/Departments and consume an OnboardingToken.
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
      membershipLimit: 500,
      invitationExpiresIn: 60 * 60 * 24 * 3, // 3 days
      cancelPendingInvitationsOnReInvite: true,
      async sendInvitationEmail(data) {
        // Wire up a real email provider here (Resend, Postmark, SES, etc).
        // Logging keeps local/dev environments functional without one.
        console.log(
          `[invitation] ${data.email} invited to "${data.organization.name}" as ${data.role} — ` +
            `accept at ${env.CLIENT_ORIGIN}/accept-invite?id=${data.invitation.id}`
        );
      },
    }),
  ],

  databaseHooks: {
    session: {
      create: {
        async before(session) {
          // Automatically resume the user's most recently used organization
          // (their sole org, in the common single-tenant case) on login.
          if (session.activeOrganizationId) return { data: session };
          const member = await prisma.member.findFirst({
            where: { userId: session.userId },
            orderBy: { createdAt: "asc" },
          });
          return { data: { ...session, activeOrganizationId: member?.organizationId ?? null } };
        },
      },
    },
  },

  onAPIError: {
    onError(error) {
      console.error("[better-auth]", error);
    },
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: false, // not needed — you're cross-*site*, not cross-*subdomain*
    },
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      partitioned: true, // needed for Chrome's CHIPS in third-party-cookie contexts
    },
  },
});

export type Auth = typeof auth;
export type AuthSession = typeof auth.$Infer.Session;
