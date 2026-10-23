import { createMemoryStore } from "./memory";
import { createUpstashStore, isUpstashConfigured } from "./upstash";
import type { StorageKind, UserStore } from "./types";

export * from "./types";

let resolved: UserStore | null = null;
let resolvedKind: StorageKind = "memory";

/**
 * Pick the best available backend once per instance:
 *   1. Upstash Redis  (set UPSTASH_REDIS_REST_URL + _TOKEN)  -> durable
 *   2. JSON file      (local dev / any Node server)          -> durable
 *   3. memory + browser account mirror                       -> ephemeral
 *
 * Every probe is bounded, and on Vercel the file probe is skipped outright
 * unless GEMBYAV_DATA_DIR is set: the bundle directory is read-only there, so
 * probing it can only cost time — and on an exotic mount `mkdir` may block
 * indefinitely rather than throw.
 */
export async function getStore(): Promise<UserStore> {
  if (resolved) return resolved;

  if (isUpstashConfigured()) {
    const store = createUpstashStore();
    try {
      // cheap round-trip so a bad token degrades instead of 500-ing
      await store.getByEmail("probe@gembyav.invalid");
      resolved = store;
      resolvedKind = "upstash";
      return resolved;
    } catch (err) {
      console.warn("[store] Upstash configured but unreachable, falling back:", (err as Error).message);
    }
  }

  const onVercel = Boolean(process.env.VERCEL);
  const explicitDir = Boolean(process.env.GEMBYAV_DATA_DIR);

  if (!onVercel || explicitDir) {
    try {
      const { createFileStore, isFileStoreWritable } = await import("./file");
      if (await isFileStoreWritable()) {
        resolved = createFileStore();
        resolvedKind = "file";
        return resolved;
      }
      console.warn(
        `[store] ${explicitDir ? "GEMBYAV_DATA_DIR" : "cwd"} is not writable — using memory mode`,
      );
    } catch (err) {
      console.warn("[store] file backend unavailable:", (err as Error).message);
    }
  } else {
    // Vercel's bundle directory is read-only, so probing it can only cost time.
    console.warn(
      "[store] read-only Vercel filesystem — using memory mode. Set " +
        "UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN for durable accounts.",
    );
  }

  resolved = createMemoryStore();
  resolvedKind = "memory";
  return resolved;
}

export function storeKind(): StorageKind {
  return resolvedKind;
}

export const STORAGE_LABEL: Record<StorageKind, string> = {
  upstash: "Upstash Redis",
  file: "Local disk",
  memory: "In-browser (demo)",
};
