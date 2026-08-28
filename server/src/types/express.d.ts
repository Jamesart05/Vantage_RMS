import type { Member, User } from "../../generated/prisma";

declare global {
  namespace Express {
    interface Request {
      /** Populated by `requireAuth` from the better-auth session. */
      user?: User;
      session?: {
        id: string;
        userId: string;
        activeOrganizationId?: string | null;
        expiresAt: Date;
      };
      /** Populated by `requireOrganization` — the caller's membership row for the resolved org. */
      member?: Member;
      /** Populated by `requireOrganization` — the resolved organization id for this request. */
      organizationId?: string;
    }
  }
}

export {};
