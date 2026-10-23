import { NextResponse } from "next/server";
import { hashPassword, checkPasswordStrength } from "@/lib/auth/password";
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

export async function POST(req: Request) {
  const limit = rateLimit(clientKey(req, "signup"), { limit: 8, windowMs: 600_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many sign-ups from this network. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { name, email, password, mirrors } = (body ?? {}) as {
    name?: string;
    email?: string;
    password?: string;
    mirrors?: string[];
  };

  const cleanName = (name ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
  const cleanEmail = normalizeEmail(email ?? "");
  const pw = password ?? "";

  if (cleanName.length < 2) {
    return NextResponse.json({ error: "Please enter your name (at least 2 characters)." }, { status: 400 });
  }
  if (!isValidEmail(cleanEmail)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  const strength = checkPasswordStrength(pw);
  if (!strength.ok) {
    return NextResponse.json(
      { error: strength.hints[0] || "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const store = await getStore();
  // Re-hydrate memory mode from browser-held mirrors before checking for dupes.
  await importMirrors(mirrors, store);

  try {
    if (await store.getByEmail(cleanEmail)) {
      return NextResponse.json(
        { error: "That email is already registered. Try signing in instead." },
        { status: 409 },
      );
    }

    const user = {
      id: crypto.randomUUID(),
      email: cleanEmail,
      name: cleanName,
      verifier: await hashPassword(pw),
      createdAt: new Date().toISOString(),
    };

    await store.create(user);
    await setSessionCookie(user);

    return NextResponse.json({
      user: toPublicUser(user),
      mirror: store.durable ? null : await signMirror(user),
      storage: store.kind,
      storageLabel: STORAGE_LABEL[store.kind],
    });
  } catch (err) {
    console.error("[auth] signup failed:", err);
    return NextResponse.json(
      { error: "Could not create your account. Please try again." },
      { status: 500 },
    );
  }
}
