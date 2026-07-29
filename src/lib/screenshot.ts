import "server-only";

/**
 * Captures a screenshot of a live site so a project preview can be generated
 * from its URL instead of uploaded by hand.
 *
 * Two keyless providers, tried in order: Microlink renders at 2560×1600 which
 * looks right on high-DPI screens, and thum.io covers the case where Microlink
 * is rate-limited or slow. Whichever answers first wins.
 *
 * The result is stored in our own Supabase bucket by the caller, so each site
 * is only ever fetched once — after that the image is ours, and neither
 * provider's rate limit or uptime matters.
 */

const PROVIDER_TIMEOUT_MS = 20_000;
const REACHABILITY_TIMEOUT_MS = 12_000;
const MAX_BYTES = 6 * 1024 * 1024; // matches the storage bucket's limit

export type Capture =
  | { ok: true; bytes: Uint8Array; contentType: string; provider: string }
  | { ok: false; error: string };

/** Hosts that should never be fetched — loopback, link-local, private ranges. */
const PRIVATE_HOST =
  /^(localhost|\[?::1\]?|.*\.local|.*\.internal|10\.\d+\.\d+\.\d+|127\.\d+\.\d+\.\d+|169\.254\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/i;

/**
 * Only public http(s) URLs.
 *
 * The private-host check matters because `isReachable` below fetches the target
 * from our own server, so an address like `127.0.0.1` or `.internal` could
 * otherwise be used to probe things that aren't meant to be reachable.
 */
export function normaliseTarget(raw: string): string | null {
  const trimmed = raw.trim();
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".") && url.hostname !== "localhost") return null;
    if (PRIVATE_HOST.test(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Confirms the page actually loads before spending 10 seconds rendering it.
 *
 * Without this, screenshot providers happily return a picture of the browser's
 * own "This site can't be reached" page, which then looks like a real preview
 * and would go live on the portfolio. A dead domain or a 404 has to fail loudly
 * instead.
 */
async function isReachable(target: string): Promise<boolean> {
  try {
    const response = await fetch(target, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(REACHABILITY_TIMEOUT_MS),
      headers: {
        // Some hosts serve error pages to unrecognised clients.
        "user-agent":
          "Mozilla/5.0 (compatible; ernieblaze.dev preview checker; +https://ernieblaze.dev)",
        accept: "text/html,*/*",
      },
      cache: "no-store",
    });
    return response.status < 400;
  } catch {
    return false;
  }
}

async function fetchImage(
  url: string,
  provider: string,
): Promise<Capture | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      headers: { accept: "image/*" },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;

    const bytes = new Uint8Array(await response.arrayBuffer());

    // A few hundred bytes means a placeholder or an error page, not a render.
    if (bytes.byteLength < 5_000 || bytes.byteLength > MAX_BYTES) return null;

    return { ok: true, bytes, contentType, provider };
  } catch {
    return null;
  }
}

/** Microlink returns JSON pointing at the rendered image. */
async function viaMicrolink(target: string): Promise<Capture | null> {
  try {
    const api = new URL("https://api.microlink.io/");
    api.searchParams.set("url", target);
    api.searchParams.set("screenshot", "true");
    api.searchParams.set("meta", "false");
    api.searchParams.set("viewport.width", "1600");
    api.searchParams.set("viewport.height", "1000");

    const response = await fetch(api, {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) return null;

    const body = (await response.json()) as {
      data?: { screenshot?: { url?: string } };
    };
    const imageUrl = body.data?.screenshot?.url;
    if (!imageUrl) return null;

    return fetchImage(imageUrl, "microlink");
  } catch {
    return null;
  }
}

/** thum.io serves the render directly from the URL. */
async function viaThumIo(target: string): Promise<Capture | null> {
  return fetchImage(
    `https://image.thum.io/get/width/1600/crop/1000/noanimate/${target}`,
    "thum.io",
  );
}

export async function captureScreenshot(rawUrl: string): Promise<Capture> {
  const target = normaliseTarget(rawUrl);
  if (!target) {
    return { ok: false, error: "That doesn't look like a valid website address." };
  }

  if (!(await isReachable(target))) {
    return {
      ok: false,
      error:
        "That address didn't load, so there's nothing to capture. Check the URL is live and public, then try again.",
    };
  }

  for (const provider of [viaMicrolink, viaThumIo]) {
    const result = await provider(target);
    if (result?.ok) return result;
  }

  return {
    ok: false,
    error:
      "Couldn't capture that site. It may be slow, password-protected, or blocking screenshot services — upload an image instead.",
  };
}
