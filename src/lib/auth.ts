import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Single-user admin auth.
 *
 * One shared password, checked server-side, exchanged for a signed session
 * cookie. It is intentionally minimal — good enough for one person guarding
 * their own portfolio, not a multi-user auth system. See README ("Going to
 * production") before putting anything sensitive behind it.
 */

export const SESSION_COOKIE = "eb_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 12; // 12 hours

/** Change the password by setting ADMIN_PASSWORD in .env.local. */
function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "ernieblaze2026";
}

/**
 * Signing key for the session cookie. Set ADMIN_SESSION_SECRET in production
 * so restarting the server doesn't invalidate sessions — and so the token
 * isn't derived from the password alone.
 */
function sessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || `dev-secret:${adminPassword()}`;
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyPassword(candidate: string): boolean {
  return safeEqual(candidate, adminPassword());
}

/** `<expiresAt>.<hmac>` — self-contained, no server-side session store. */
export function createSessionToken(): string {
  const expiresAt = String(Date.now() + SESSION_MAX_AGE * 1000);
  return `${expiresAt}.${sign(expiresAt)}`;
}

export function isValidSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature) return false;
  if (!safeEqual(signature, sign(expiresAt))) return false;
  return Number(expiresAt) > Date.now();
}

/** True when the current request carries a valid admin session. */
export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return isValidSessionToken(store.get(SESSION_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};
