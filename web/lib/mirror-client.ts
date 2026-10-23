"use client";

/**
 * Browser-side account mirrors.
 *
 * Only used when the deploy has no durable user store (the default on Vercel).
 * The server hands back an HMAC-signed copy of the account record; we keep it
 * here and replay it on later sign-ins so a cold serverless instance can still
 * verify the password. Never contains the plain-text password.
 */

const KEY = "gembyav.accounts.v1";

export function readMirrors(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((m): m is string => typeof m === "string") : [];
  } catch {
    return [];
  }
}

export function saveMirror(mirror?: string | null): void {
  if (typeof window === "undefined" || !mirror) return;
  try {
    const all = readMirrors().filter((m) => m !== mirror);
    all.push(mirror);
    // Keep the footprint small — the last 5 accounts is plenty.
    window.localStorage.setItem(KEY, JSON.stringify(all.slice(-5)));
  } catch {
    /* private browsing / quota — non-fatal */
  }
}

export function clearMirrors(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
