"use client";

import { Database, Info } from "lucide-react";
import { useSession } from "./session-provider";

/**
 * Surfaces which user store the deploy is actually using, so nobody is
 * surprised that accounts are per-browser on a default Vercel deploy.
 */
export function StorageBadge({ className = "" }: { className?: string }) {
  const { storageLabel, durable, weakSecret, loading } = useSession();
  if (loading) return null;

  return (
    <div className={className}>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.7rem] ${
          durable
            ? "border-mint-400/25 bg-mint-400/10 text-mint-300"
            : "border-gold-400/25 bg-gold-400/10 text-gold-300"
        }`}
        title={
          durable
            ? `Accounts are stored in ${storageLabel} and shared across devices.`
            : `No database is attached, so accounts live in ${storageLabel}. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel to make them durable.`
        }
      >
        <Database className="size-3" />
        {storageLabel}
      </span>

      {weakSecret ? (
        <span
          className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-alert-500/25 bg-alert-500/10 px-2.5 py-1 text-[0.7rem] text-alert-300"
          title="AUTH_SECRET is not set, so sessions are signed with a development key. Set AUTH_SECRET in Vercel for production."
        >
          <Info className="size-3" />
          Set AUTH_SECRET
        </span>
      ) : null}
    </div>
  );
}
