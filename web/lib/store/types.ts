export type StorageKind = "upstash" | "file" | "memory";

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  /** scrypt verifier — never returned to the browser */
  verifier: string;
  createdAt: string;
  lastSignInAt?: string;
}

export interface UserStore {
  readonly kind: StorageKind;
  /** true when accounts survive a cold start / redeploy */
  readonly durable: boolean;
  getByEmail(email: string): Promise<StoredUser | null>;
  getById(id: string): Promise<StoredUser | null>;
  create(user: StoredUser): Promise<void>;
  touch(id: string, at: string): Promise<void>;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export function toPublicUser(u: StoredUser): PublicUser {
  return { id: u.id, email: u.email, name: u.name, createdAt: u.createdAt };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.trim()) && email.length <= 254;
}
