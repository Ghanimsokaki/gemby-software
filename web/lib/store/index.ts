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

  try {
    const { createFileStore, isFileStoreWritable } = await import("./file");
    if (await isFileStoreWritable()) {
      resolved = createFileStore();
      resolvedKind = "file";
      return resolved;
    }
  } catch (err) {
    console.warn("[store] file backend unavailable:", (err as Error).message);
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
