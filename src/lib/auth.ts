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

/** The default is documented in a public README, so it is a local-only convenience. */
const DEV_PASSWORD = "ernieblaze2026";

/**
 * Change the password by setting ADMIN_PASSWORD.
 *
 * In production there is no fallback. A default password that is written down
 * in a public repository is not a password, and the previous behaviour meant a
 * deploy that simply forgot the environment variable was wide open to anyone
 * who had read the setup guide — silently, with the dashboard behaving
 * normally. Failing shut is the only safe direction here: an admin route that
 * throws is an inconvenience, one that lets a stranger in is not.
 */
function adminPassword(): string {
  const configured = process.env.ADMIN_PASSWORD;
  if (configured) return configured;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ADMIN_PASSWORD is not set. Set it in your hosting environment — the " +
        "development default is published in this repo's README and must not " +
        "be relied on in production.",
    );
  }

  return DEV_PASSWORD;
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

/**
 * True when the current request carries a valid admin session.
 *
 * Never throws. A misconfigured `ADMIN_PASSWORD` makes `sign` throw, and this
 * is called from public paths too (`GET /api/projects` uses it to decide
 * whether to include drafts) — so a missing variable must read as "not an
 * admin", not as a 500 on a public endpoint. The signing failure still blocks
 * every write, which is the behaviour that matters.
 */
export async function isAuthenticated(): Promise<boolean> {
  // `cookies()` stays outside the try. Next signals "this route is dynamic" by
  // throwing from it during prerender, and swallowing that would let a page
  // that depends on a session be statically rendered as signed-out.
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  try {
    return isValidSessionToken(token);
  } catch (error) {
    console.error("[auth] Could not verify the session:", error);
    return false;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};
