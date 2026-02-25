import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware is intentionally lightweight — it does NOT create sessions
 * (that's async work for the client). Its job is:
 *
 * 1. Skip static assets and Next.js internals.
 * 2. For the /api/transcribe route, verify the request carries a session-id
 *    header so the backend can validate it.
 * 3. Allow all other routes through — the ChatProvider in the client handles
 *    session creation and gates the UI accordingly.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── API routes that require an active session ────────────────────────────
  if (pathname.startsWith("/api/transcribe")) {
    const sessionId = req.headers.get("x-session-id");
    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session ID. Start a chat session first." },
        { status: 401 }
      );
    }
  }

  // ── Pass everything else through ─────────────────────────────────────────
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};