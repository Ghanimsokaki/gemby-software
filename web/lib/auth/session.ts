import { cookies } from "next/headers";
import {
  COOKIE_NAME,
  SESSION_TTL_SECONDS,
  b64url,
  b64urlDecode,
  getSecret,
  signToken,
  verifyToken,
  type SessionPayload,
} from "./token";
import type { StoredUser } from "@/lib/store/types";

const ENC = new TextEncoder();

/* ------------------------------------------------------------------ cookies */

export async function setSessionCookie(user: StoredUser): Promise<void> {
  const token = await signToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export async function readSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  return verifyToken(jar.get(COOKIE_NAME)?.value);
}

export async function requireSession(): Promise<SessionPayload> {
  const s = await readSession();
  if (!s) throw new Error("unauthenticated");
  return s;
}

/* ------------------------------------------------- account mirror (memory) */

/**
 * An HMAC-signed copy of an account record that the browser keeps so memory
 * mode survives serverless cold starts. Only ever handed to the owner of the
 * account, and re-verified server-side before it is trusted.
 */
export async function signMirror(user: StoredUser): Promise<string> {
  const body = b64url(
    JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      verifier: user.verifier,
      createdAt: user.createdAt,
    }),
  );
  const { secret } = getSecret();
  const key = await crypto.subtle.importKey(
    "raw",
    ENC.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, ENC.encode(body));
  return `${body}.${b64url(new Uint8Array(sig))}`;
}

export async function verifyMirror(mirror?: string | null): Promise<StoredUser | null> {
  if (!mirror || typeof mirror !== "string" || !mirror.includes(".")) return null;
  const [body, sig] = mirror.split(".");
  if (!body || !sig) return null;
  try {
    const { secret } = getSecret();
    const key = await crypto.subtle.importKey(
      "raw",
      ENC.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      Uint8Array.from(atob(sig.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
        c.charCodeAt(0),
      ),
      ENC.encode(body),
    );
    if (!ok) return null;
    const parsed = JSON.parse(b64urlDecode(body)) as StoredUser;
    if (!parsed?.id || !parsed?.email || !parsed?.verifier) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Re-hydrate the store from browser-held mirrors. No-op for durable backends.
 */
export async function importMirrors(
  mirrors: unknown,
  store: { durable: boolean; getByEmail: (e: string) => Promise<StoredUser | null>; create: (u: StoredUser) => Promise<void> },
): Promise<number> {
  if (store.durable || !Array.isArray(mirrors)) return 0;
  let imported = 0;
  for (const raw of mirrors.slice(0, 20)) {
    const user = await verifyMirror(typeof raw === "string" ? raw : null);
    if (!user) continue;
    if (await store.getByEmail(user.email)) continue;
    try {
      await store.create(user);
      imported += 1;
    } catch {
      /* duplicate — ignore */
    }
  }
  return imported;
}

/* ------------------------------------------------------------------- config */

export function authConfig() {
  const { weak } = getSecret();
  return { weakSecret: weak };
}
