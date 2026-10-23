import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type { StoredUser, UserStore } from "./types";
import { normalizeEmail } from "./types";

/**
 * JSON file store. This is what `npm run dev` uses, so accounts persist
 * between restarts locally. On Vercel's read-only function filesystem the
 * first write throws and we transparently fall back to memory mode.
 */

const DATA_DIR = process.env.GEMBYAV_DATA_DIR
  ? resolve(process.env.GEMBYAV_DATA_DIR)
  : resolve(process.cwd(), ".data");
const FILE = join(DATA_DIR, "users.json");

interface DB {
  users: StoredUser[];
}

let cache: DB | null = null;
let writable: boolean | null = null;

async function load(): Promise<DB> {
  if (cache) return cache;
  try {
    cache = JSON.parse(await readFile(FILE, "utf8")) as DB;
    if (!Array.isArray(cache.users)) cache = { users: [] };
  } catch {
    cache = { users: [] };
  }
  return cache;
}

async function persist(db: DB): Promise<void> {
  await mkdir(dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(db, null, 2), "utf8");
  cache = db;
  writable = true;
}

/**
 * Bound any filesystem probe.
 *
 * This matters more than it looks: `fs.mkdir(..., { recursive: true })` does
 * not reliably throw on an exotic read-only mount — on some filesystems it
 * blocks indefinitely. An unbounded probe here would hang every sign-in
 * request instead of degrading to memory mode.
 */
const PROBE_TIMEOUT_MS = 1500;

function withTimeout<T>(work: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolvePromise) => {
    const timer = setTimeout(() => resolvePromise(fallback), ms);
    // Never keep the process alive just for a probe.
    timer.unref?.();
    work.then(
      (v) => {
        clearTimeout(timer);
        resolvePromise(v);
      },
      () => {
        clearTimeout(timer);
        resolvePromise(fallback);
      },
    );
  });
}

async function probe(): Promise<boolean> {
  try {
    await mkdir(dirname(FILE), { recursive: true });
    const p = join(dirname(FILE), `.write-probe-${process.pid}`);
    await writeFile(p, "ok", "utf8");
    await rm(p, { force: true });
    return true;
  } catch {
    return false;
  }
}

export async function isFileStoreWritable(): Promise<boolean> {
  if (writable !== null) return writable;
  writable = await withTimeout(probe(), PROBE_TIMEOUT_MS, false);
  return writable;
}

export function createFileStore(): UserStore {
  return {
    kind: "file",
    durable: true,
    async getByEmail(email) {
      const db = await load();
      const target = normalizeEmail(email);
      return db.users.find((u) => normalizeEmail(u.email) === target) ?? null;
    },
    async getById(id) {
      const db = await load();
      return db.users.find((u) => u.id === id) ?? null;
    },
    async create(user) {
      const db = await load();
      if (db.users.some((u) => normalizeEmail(u.email) === normalizeEmail(user.email))) {
        throw new Error("Email already registered");
      }
      await persist({ users: [...db.users, user] });
    },
    async touch(id, at) {
      const db = await load();
      const idx = db.users.findIndex((u) => u.id === id);
      if (idx === -1) return;
      const users = [...db.users];
      users[idx] = { ...users[idx], lastSignInAt: at };
      await persist({ users });
    },
  };
}
