/**
 * Page atmosphere: one hairline grid and two soft accent blooms.
 *
 * Pure CSS and fixed-position, so it costs nothing to scroll and never
 * repaints. Every colour comes from a token, so the same markup produces a
 * cyan glow on near-black and a cool teal wash on light — the light version is
 * deliberately weaker, because a bloom that reads as atmosphere on dark reads
 * as a smudge on white.
 *
 * The hero's particle field sits on top of this. This layer stays still.
 */
export function Ambient() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Blueprint grid, fading out toward the bottom of the viewport */}
      <div className="grid-field absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />

      {/* Bloom behind the hero */}
      <div
        className="absolute -top-[22rem] right-[-14rem] size-[46rem] rounded-full blur-[140px]"
        style={{ backgroundColor: "var(--glow-soft)" }}
      />

      {/* Dimmer counterweight low on the left */}
      <div
        className="absolute bottom-[-20rem] left-[-16rem] size-[40rem] rounded-full blur-[150px]"
        style={{ backgroundColor: "var(--glow-soft)", opacity: 0.6 }}
      />

      {/* Vignette so text never sits on a bright edge */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, transparent 40%, var(--bg) 100%)",
        }}
      />
    </div>
  );
}
