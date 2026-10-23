import type { StoredUser, UserStore } from "./types";
import { normalizeEmail } from "./types";

/**
 * In-process memory store.
 *
 * Used when no Redis is configured AND the filesystem is read-only (i.e. a
 * default Vercel deploy). A serverless instance forgets everything when it
 * goes cold, so on its own this would make "sign in again" fail.
 *
 * The portal solves that with an *account mirror*: after a successful sign-up
 * the browser keeps an HMAC-signed copy of its own account record and replays
 * it on later requests, which re-hydrates this map. Sessions themselves are
 * stateless signed cookies, so a signed-in user is never affected by a cold
 * start either way.
 */

const users = new Map<string, StoredUser>();

export function createMemoryStore(): UserStore {
  return {
    kind: "memory",
    durable: false,
    async getByEmail(email) {
      return users.get(normalizeEmail(email)) ?? null;
    },
    async getById(id) {
      for (const u of users.values()) if (u.id === id) return u;
      return null;
    },
    async create(user) {
      const key = normalizeEmail(user.email);
      if (users.has(key)) throw new Error("Email already registered");
      users.set(key, user);
    },
    async touch(id, at) {
      for (const [key, u] of users) {
        if (u.id === id) users.set(key, { ...u, lastSignInAt: at });
      }
    },
  };
}

export function memorySize(): number {
  return users.size;
}
