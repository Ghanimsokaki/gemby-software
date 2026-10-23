import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth/token";

/**
 * Next.js 16 renamed `middleware.ts` to `proxy.ts` — same behaviour, it runs
 * before the filesystem, so it also guards the static installer.
 *
 * Two jobs:
 *   1. Keep signed-out visitors away from the app pages.
 *   2. Keep the 13 MB `GembyAV.exe` behind the same sign-in wall.
 *
 * Token verification uses Web Crypto only, so this is Edge-runtime safe.
 */

const APP_PATHS = new Set(["/dashboard", "/download", "/chat"]);
const AUTH_PATHS = new Set(["/signin", "/signup"]);

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = await verifyToken(token);

  // The installer (and its manifest) live under /downloads/*
  const isAsset = pathname.startsWith("/downloads/");

  if (isAsset) {
    if (session) {
      // Let the CDN serve the file, but make the auth boundary visible and
      // stop the browser caching it for a signed-out session later.
      const res = NextResponse.next();
      res.headers.set("Cache-Control", "private, max-age=3600");
      res.headers.set("X-Gemby-Session", session.sub.slice(0, 8));
      return res;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.search = `?next=${encodeURIComponent(pathname)}&reason=auth`;
    return NextResponse.redirect(url);
  }

  if (APP_PATHS.has(pathname)) {
    if (session) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.search = `?next=${encodeURIComponent(pathname + search)}&reason=auth`;
    return NextResponse.redirect(url);
  }

  // Signed-in users have no business on the auth screens.
  if (AUTH_PATHS.has(pathname) && session) {
    const next = request.nextUrl.searchParams.get("next");
    const url = request.nextUrl.clone();
    url.pathname = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Deliberately narrow: never run on _next, images or other public assets.
  matcher: ["/dashboard", "/download", "/chat", "/signin", "/signup", "/downloads/:path*"],
};
