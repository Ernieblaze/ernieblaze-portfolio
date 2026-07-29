import { ImageResponse } from "next/og";

import { site } from "@/lib/site";

export const alt = `${site.name} — ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The card people see when the site is shared on X, LinkedIn, or Slack.
 * Mirrors the hero: address bar, name, tagline.
 */
export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#050505",
          backgroundImage:
            "radial-gradient(900px 500px at 78% -10%, rgba(0,240,255,0.20), transparent 65%), linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 72px 72px, 72px 72px",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 22px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              fontSize: 26,
              color: "#a1a1aa",
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: "#00f0ff",
              }}
            />
            {site.domain}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div
            style={{
              fontSize: 118,
              fontWeight: 700,
              letterSpacing: -5,
              lineHeight: 1,
            }}
          >
            {site.name}
          </div>
          <div
            style={{
              fontSize: 36,
              lineHeight: 1.32,
              color: "#a1a1aa",
              maxWidth: 940,
            }}
          >
            {site.tagline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 26,
            color: "#a1a1aa",
          }}
        >
          <div style={{ display: "flex" }}>{site.role}</div>
          <div style={{ display: "flex", color: "#00f0ff" }}>
            {site.availability.label}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
