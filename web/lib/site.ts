import { CHAT_MODEL, PRODUCT } from "./config";

export function siteUrl(): string {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return explicit.replace(/\/$/, "") || "http://localhost:3000";
}

export const SITE = {
  name: `${PRODUCT.name} Portal`,
  title: `${PRODUCT.name} — ${PRODUCT.tagline}`,
  description:
    "Download GembyAV, the free open-source multi-layer antivirus for Windows 10/11. Sign in to get the installer, verify its checksum and talk to the built-in support assistant.",
  url: siteUrl(),
  model: CHAT_MODEL,
} as const;

export function formatBytes(n: number | null | undefined): string {
  if (!n || n <= 0) return "—";
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(2)} GB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(2)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} B`;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
