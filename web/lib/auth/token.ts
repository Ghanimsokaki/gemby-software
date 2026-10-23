/**
 * Signed session tokens that work in BOTH runtimes:
 *   - Node.js route handlers (sign-in / sign-up)
 *   - the Edge proxy that guards /dashboard and the installer
 *
 * Only Web Crypto is used, so the same code runs on Vercel Edge and Node 20+.
 *
 * Format:  base64url(JSON payload) + "." + base64url(HMAC-SHA256(payload))
 */

const ENC = new TextEncoder();
const DEC = new TextDecoder();

export const COOKIE_NAME = "gembyav_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  /** user id */
  sub: string;
  email: string;
  name: string;
  /** issued at, unix seconds */
  iat: number;
  /** expires at, unix seconds */
  exp: number;
}

export function b64url(bytes: Uint8Array | string): string {
  const buf = typeof bytes === "string" ? ENC.encode(bytes) : bytes;
  let bin = "";
  for (const b of buf) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlDecode(value: string): string {
  const pad = value.replace(/-/g, "+").replace(/_/g, "/");
  return DEC.decode(
    Uint8Array.from(atob(pad + "=".repeat((4 - (pad.length % 4)) % 4)), (c) =>
      c.charCodeAt(0),
    ),
  );
}

/**
 * A missing AUTH_SECRET must not brick a fresh Vercel deploy, so we fall back
 * to a stable development secret. `isWeakSecret` lets the UI warn about it.
 */
const FALLBACK_SECRET = "gembyav-dev-secret-do-not-use-in-production";

export function getSecret(): { secret: string; weak: boolean } {
  const fromEnv =
    process.env.AUTH_SECRET ||
    process.env.NEXT_PUBLIC_AUTH_SECRET ||
    process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 16) return { secret: fromEnv, weak: false };
  return { secret: FALLBACK_SECRET, weak: true };
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    ENC.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signToken(
  payload: Omit<SessionPayload, "iat" | "exp">,
  ttlSeconds = SESSION_TTL_SECONDS,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const full: SessionPayload = { ...payload, iat: now, exp: now + ttlSeconds };
  const body = b64url(JSON.stringify(full));
  const { secret } = getSecret();
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), ENC.encode(body));
  return `${body}.${b64url(new Uint8Array(sig))}`;
}

export async function verifyToken(token?: string | null): Promise<SessionPayload | null> {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const { secret } = getSecret();
    const key = await hmacKey(secret);
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      Uint8Array.from(atob(sig.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
        c.charCodeAt(0),
      ),
      ENC.encode(body),
    );
    if (!ok) return null;
    const payload = JSON.parse(b64urlDecode(body)) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    if (!payload.sub || !payload.email) return null;
    return payload;
  } catch {
    return null;
  }
}
