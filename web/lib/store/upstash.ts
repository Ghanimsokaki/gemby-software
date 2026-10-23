import type { StoredUser, UserStore } from "./types";
import { normalizeEmail } from "./types";

/**
 * Upstash Redis over its plain REST API — zero dependencies, works in any
 * Node runtime. Enable it by setting UPSTASH_REDIS_REST_URL + TOKEN (or the
 * shorter REDIS_URL / KV_URL aliases) in your Vercel project.
 *
 * Keys:
 *   gembyav:user:email:<email>  -> StoredUser JSON
 *   gembyav:user:id:<id>        -> StoredUser JSON
 */

const PREFIX = "gembyav:user";

function config(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    process.env.REDIS_REST_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    process.env.REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

export function isUpstashConfigured(): boolean {
  return config() !== null;
}

const REQUEST_TIMEOUT_MS = Number(process.env.UPSTASH_TIMEOUT_MS || 8000);

async function cmd<T>(args: unknown[]): Promise<T> {
  const c = config();
  if (!c) throw new Error("Upstash is not configured");

  // Bounded: an unreachable Redis must degrade to the next backend, not hang
  // the sign-in request until the platform kills it.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  timer.unref?.();

  try {
    const res = await fetch(c.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${c.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      signal: controller.signal,
      // never let Vercel cache auth data
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);
    const json = (await res.json()) as { result?: T; error?: string };
    if (json.error) throw new Error(json.error);
    return json.result as T;
  } finally {
    clearTimeout(timer);
  }
}

function parse(raw: string | null): StoredUser | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function createUpstashStore(): UserStore {
  return {
    kind: "upstash",
    durable: true,
    async getByEmail(email) {
      return parse(await cmd<string | null>(["GET", `${PREFIX}:email:${normalizeEmail(email)}`]));
    },
    async getById(id) {
      return parse(await cmd<string | null>(["GET", `${PREFIX}:id:${id}`]));
    },
    async create(user) {
      const body = JSON.stringify(user);
      await cmd(["SET", `${PREFIX}:email:${normalizeEmail(user.email)}`, body]);
      await cmd(["SET", `${PREFIX}:id:${user.id}`, body]);
    },
    async touch(id, at) {
      const existing = parse(await cmd<string | null>(["GET", `${PREFIX}:id:${id}`]));
      if (!existing) return;
      const next = { ...existing, lastSignInAt: at };
      const body = JSON.stringify(next);
      await cmd(["SET", `${PREFIX}:id:${id}`, body]);
      await cmd(["SET", `${PREFIX}:email:${normalizeEmail(existing.email)}`, body]);
    },
  };
}
