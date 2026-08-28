import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Routes that don't require a session at all.
const PUBLIC_PATHS = ["/sign-in", "/sign-up"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // getSessionCookie only checks whether a session cookie is present (fast,
  // edge-safe, no DB call) — it's a UX optimization, not the source of
  // truth. Real authorization still happens against the backend on every
  // API call, and AuthGuard double-checks the session client-side.
  const hasSession = !!getSessionCookie(request);

  if (!hasSession && !PUBLIC_PATHS.includes(pathname) && pathname !== "/onboarding") {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  if (hasSession && PUBLIC_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
