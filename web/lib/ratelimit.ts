/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Per-instance only (a cold serverless function starts empty), so it is abuse
 * damping rather than a hard guarantee — which is the right trade for a
 * dependency-free portal. Point it at Upstash if you need a real one.
 */

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

export interface LimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): LimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { hits: [] };
    buckets.set(key, bucket);
  }
  bucket.hits = bucket.hits.filter((t) => t > cutoff);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0] ?? now;
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  bucket.hits.push(now);

  // Opportunistic cleanup so a long-lived instance cannot grow unbounded.
  if (buckets.size > 4000) {
    for (const [k, b] of buckets) {
      b.hits = b.hits.filter((t) => t > cutoff);
      if (b.hits.length === 0) buckets.delete(k);
    }
  }

  return { ok: true, remaining: limit - bucket.hits.length, retryAfterSeconds: 0 };
}

/** Best-effort client identity for limiting. */
export function clientKey(req: Request, scope: string): string {
  const h = req.headers;
  const ip =
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("cf-connecting-ip") ||
    "unknown";
  return `${scope}:${ip}`;
}
