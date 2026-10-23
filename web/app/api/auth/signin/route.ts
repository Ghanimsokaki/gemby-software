import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import {
  importMirrors,
  setSessionCookie,
  signMirror,
} from "@/lib/auth/session";
import { getStore, isValidEmail, normalizeEmail, toPublicUser } from "@/lib/store";
import { STORAGE_LABEL } from "@/lib/store";
import { clientKey, rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERIC_ERROR = "Incorrect email or password.";

export async function POST(req: Request) {
  const limit = rateLimit(clientKey(req, "signin"), { limit: 20, windowMs: 600_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { email, password, mirrors } = (body ?? {}) as {
    email?: string;
    password?: string;
    mirrors?: string[];
  };

  const cleanEmail = normalizeEmail(email ?? "");
  if (!isValidEmail(cleanEmail) || !password) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const store = await getStore();
  // Critical for memory mode: the browser replays its signed account mirrors so
  // a cold serverless instance can still verify the password.
  await importMirrors(mirrors, store);

  try {
    const user = await store.getByEmail(cleanEmail);
    if (!user) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }
    if (!(await verifyPassword(password, user.verifier))) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    await store.touch(user.id, new Date().toISOString());
    await setSessionCookie(user);

    return NextResponse.json({
      user: toPublicUser(user),
      mirror: store.durable ? null : await signMirror(user),
      storage: store.kind,
      storageLabel: STORAGE_LABEL[store.kind],
    });
  } catch (err) {
    console.error("[auth] signin failed:", err);
    return NextResponse.json({ error: "Sign-in failed. Please try again." }, { status: 500 });
  }
}
