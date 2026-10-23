import { NextResponse } from "next/server";
import { authConfig, readSession } from "@/lib/auth/session";
import { getStore, STORAGE_LABEL } from "@/lib/store";
import { providerConfig } from "@/lib/bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [session, store] = await Promise.all([readSession(), getStore()]);
  const cfg = providerConfig();

  return NextResponse.json({
    authenticated: Boolean(session),
    user: session
      ? { id: session.sub, email: session.email, name: session.name }
      : null,
    expiresAt: session ? new Date(session.exp * 1000).toISOString() : null,
    storage: store.kind,
    storageLabel: STORAGE_LABEL[store.kind],
    durable: store.durable,
    chat: {
      model: cfg.label,
      providerEnabled: cfg.enabled,
    },
    warnings: {
      weakSecret: authConfig().weakSecret,
    },
  });
}
