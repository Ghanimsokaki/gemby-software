import { NextResponse } from "next/server";
import { getManifest, primaryDownloadUrl } from "@/lib/manifest";
import { providerConfig } from "@/lib/bot";
import { PRODUCT, LINKS } from "@/lib/config";
import { authConfig } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public, unauthenticated build/deploy facts. Safe to expose: no user data,
 * no secrets — just what the download page shows anyway.
 */
export async function GET() {
  const manifest = getManifest();
  const cfg = providerConfig();

  return NextResponse.json({
    product: PRODUCT,
    links: LINKS,
    download: {
      url: primaryDownloadUrl(manifest),
      bundled: manifest.bundled,
      sizeBytes: manifest.sizeBytes,
      sizeLabel: manifest.sizeLabel,
      sha256: manifest.sha256,
      mirrors: manifest.mirrors,
      releaseUrl: manifest.releaseUrl,
    },
    chat: {
      model: cfg.label,
      providerEnabled: cfg.enabled,
      endpointsTried: cfg.endpoints.length,
    },
    warnings: {
      weakSecret: authConfig().weakSecret,
    },
    builtAt: manifest.preparedAt,
  });
}
