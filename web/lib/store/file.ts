import { mkdir, readFile, writeFile } from "node:fs/promises";
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

export async function isFileStoreWritable(): Promise<boolean> {
  if (writable !== null) return writable;
  try {
    await mkdir(dirname(FILE), { recursive: true });
    const probe = join(dirname(FILE), ".write-probe");
    await writeFile(probe, "ok", "utf8");
    writable = true;
  } catch {
    writable = false;
  }
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
