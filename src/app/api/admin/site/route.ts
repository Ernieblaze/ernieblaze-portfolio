import { NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth";
import { revalidatePublicPages } from "@/lib/revalidate";
import { getSiteContent, saveSiteContent } from "@/lib/site-content";
import { validateSiteContent } from "@/lib/validate";

/**
 * The site's own copy — hero, about, services, contact details, socials.
 *
 * Admin-only in both directions. The GET is gated too, even though the same
 * text is public on the homepage, because it returns the *merged editing view*
 * and there is no reason to hand that shape to anyone who cannot save it.
 */
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const content = await getSiteContent();
  return NextResponse.json({ content });
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = validateSiteContent(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const content = await saveSiteContent(result.value);

  // This copy is on every public page, so everything cached has to go.
  revalidatePublicPages();

  return NextResponse.json({ content });
}
