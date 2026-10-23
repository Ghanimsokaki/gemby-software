import { assetManifest } from "@/lib/generated/asset-manifest";

export interface AssetManifest {
  product: string;
  version: string;
  filename: string;
  /** false when no binary could be staged at build time */
  available: boolean;
  bundled: boolean;
  source: string | null;
  sizeBytes: number | null;
  sizeLabel: string | null;
  sha256: string | null;
  mirrors: string[];
  releaseUrl: string;
  repositoryUrl: string;
  preparedAt: string;
}

export function getManifest(): AssetManifest {
  return assetManifest;
}

/** Best URL to hand the browser: local CDN copy first, GitHub mirror second. */
export function primaryDownloadUrl(m: AssetManifest = assetManifest): string {
  return m.bundled ? `/downloads/${m.filename}` : m.mirrors[0];
}

export function humanSha(sha?: string | null, width = 16): string {
  if (!sha) return "—";
  return `${sha.slice(0, width)}…${sha.slice(-4)}`;
}
