/**
 * Page atmosphere: one hairline grid and one soft cyan bloom.
 *
 * Pure CSS and fixed-position, so it costs nothing to scroll and never
 * repaints. Deliberately restrained — the browser frames are the feature, and
 * the background's job is to stay behind them.
 */
export function Ambient() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Blueprint grid, fading out toward the bottom of the viewport */}
      <div className="grid-field absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)] opacity-60" />

      {/* Cyan bloom behind the hero */}
      <div className="bg-accent/12 absolute -top-[22rem] right-[-14rem] size-[46rem] rounded-full blur-[140px]" />

      {/* Cooler, dimmer counterweight low on the left */}
      <div className="bg-accent/6 absolute bottom-[-20rem] left-[-16rem] size-[40rem] rounded-full blur-[150px]" />

      {/* Vignette so text never sits on a bright edge */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,transparent_40%,#050505_100%)]" />
    </div>
  );
}
