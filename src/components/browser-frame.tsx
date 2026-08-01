import type { ReactNode } from "react";
import { Lock } from "lucide-react";

type BrowserFrameProps = {
  /** What sits in the address bar. A string, or a node for animated URLs. */
  address: ReactNode;
  children: ReactNode;
  /** Smaller chrome for the project grid. */
  compact?: boolean;
  className?: string;
};

/**
 * The site's signature device: a browser window.
 *
 * Ernie sells shipped websites, so every piece of work on this site is framed
 * the way a client would first see it — in a browser, at a real address. The
 * same frame wraps the hero showcase, every project card, and every case study
 * image, which is what makes the grid read as a row of open tabs.
 */
export function BrowserFrame({
  address,
  children,
  compact = false,
  className = "",
}: BrowserFrameProps) {
  return (
    <div
      className={`glass overflow-hidden rounded-xl ${compact ? "rounded-lg" : "sm:rounded-2xl"} ${className}`}
    >
      {/* Chrome */}
      <div
        className={`flex items-center gap-3 border-b border-line bg-surface ${
          compact ? "px-3 py-2" : "px-4 py-3"
        }`}
      >
        <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
          {["opacity-100", "opacity-70", "opacity-45"].map((tone) => (
            <span
              key={tone}
              className={`bg-muted/40 block rounded-full ${tone} ${compact ? "size-2" : "size-2.5"}`}
            />
          ))}
        </div>

        <div
          className={`bg-ink/60 flex min-w-0 flex-1 items-center gap-2 rounded-md border border-line ${
            compact ? "px-2 py-1" : "px-3 py-1.5"
          }`}
        >
          <Lock
            className={`text-accent/70 shrink-0 ${compact ? "size-2.5" : "size-3"}`}
            aria-hidden="true"
          />
          <span
            className={`text-muted truncate font-mono ${compact ? "text-[10px]" : "text-xs"}`}
          >
            {address}
          </span>
        </div>
      </div>

      {/* Viewport — only visible while a screenshot loads */}
      <div className="bg-ink-raised relative">{children}</div>
    </div>
  );
}
