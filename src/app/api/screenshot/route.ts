import { NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth";
import { captureScreenshot } from "@/lib/screenshot";
import { saveImageBytes } from "@/lib/uploads";

/**
 * Captures a screenshot of a project's live URL and stores it in our bucket,
 * so a preview can be generated from the address instead of uploaded by hand.
 *
 * Rendering a page and downloading the result comfortably exceeds the default
 * function timeout, hence the raised limit.
 */
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let target = "";
  try {
    const body = await request.json();
    target = typeof body?.url === "string" ? body.url : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!target) {
    return NextResponse.json(
      { error: "Add the live URL first, then capture." },
      { status: 400 },
    );
  }

  const capture = await captureScreenshot(target);
  if (!capture.ok) {
    return NextResponse.json({ error: capture.error }, { status: 502 });
  }

  const stored = await saveImageBytes(
    capture.bytes,
    capture.contentType,
    "Screenshot",
  );
  if (!stored.ok) {
    return NextResponse.json({ error: stored.error }, { status: 500 });
  }

  return NextResponse.json(
    { url: stored.url, provider: capture.provider },
    { status: 201 },
  );
}
