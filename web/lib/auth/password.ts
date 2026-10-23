/**
 * Password hashing with scrypt (built into Node — no native deps, no bcrypt).
 * Runs in Node.js route handlers only.
 *
 * Verifier format: scrypt$N$r$p$<salt b64>$<hash b64>
 */
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options?: { N?: number; r?: number; p?: number; maxmem?: number },
) => Promise<Buffer>;

const N = 16384;
const r = 8;
const p = 1;
const KEYLEN = 64;

/**
 * scrypt needs 128 * N * r * p bytes of working memory and OpenSSL refuses to
 * start unless `maxmem` is strictly above that. Give it generous headroom
 * (and never less than 64 MB) so the derive cannot fail with
 * ERR_CRYPTO_INVALID_SCRYPT_PARAMS.
 */
function maxmemFor(n: number, rr: number, pp = 1): number {
  return Math.max(64 * 1024 * 1024, 128 * n * rr * pp * 2);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password.normalize("NFKC"), salt, KEYLEN, {
    N,
    r,
    p,
    maxmem: maxmemFor(N, r, p),
  });
  return ["scrypt", N, r, p, salt.toString("base64"), derived.toString("base64")].join("$");
}

export async function verifyPassword(
  password: string,
  verifier: string,
): Promise<boolean> {
  try {
    const [scheme, nS, rS, pS, saltB64, hashB64] = verifier.split("$");
    if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
    const n = Number(nS);
    const rr = Number(rS);
    const pp = Number(pS);
    if (!Number.isFinite(n) || !Number.isFinite(rr) || !Number.isFinite(pp)) return false;
    const expected = Buffer.from(hashB64, "base64");
    const derived = await scrypt(
      password.normalize("NFKC"),
      Buffer.from(saltB64, "base64"),
      expected.length,
      { N: n, r: rr, p: pp, maxmem: maxmemFor(n, rr, pp) },
    );
    return (
      derived.length === expected.length && timingSafeEqual(derived, expected)
    );
  } catch {
    return false;
  }
}

export interface PasswordIssue {
  field: "password";
  message: string;
}

export function checkPasswordStrength(pw: string): {
  ok: boolean;
  score: number;
  hints: string[];
} {
  const hints: string[] = [];
  let score = 0;
  if (pw.length >= 8) score += 1;
  else hints.push("Use at least 8 characters.");
  if (pw.length >= 12) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  else hints.push("Mix upper and lower case.");
  if (/\d/.test(pw)) score += 1;
  else hints.push("Add a number.");
  if (/[^\w\s]/.test(pw)) score += 1;
  else hints.push("Add a symbol.");
  return { ok: pw.length >= 8, score: Math.min(score, 5), hints };
}
