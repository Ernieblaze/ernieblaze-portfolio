import { NextResponse } from "next/server";

import {
  SESSION_COOKIE,
  createSessionToken,
  isAuthenticated,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";

/** Whether the caller already has a valid session. */
export async function GET() {
  return NextResponse.json({ authenticated: await isAuthenticated() });
}

/** Sign in with the admin password. */
export async function POST(request: Request) {
  let password = "";
  try {
    const body = await request.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!verifyPassword(password)) {
    return NextResponse.json(
      { error: "That password doesn't match." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions);
  return response;
}

/** Sign out. */
export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
}
