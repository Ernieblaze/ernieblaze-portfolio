import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { site } from "@/lib/site";

export function Services() {
  return (
    <section id="services" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          route="/services"
          title="What you can hire me for"
          intro="Fixed scope, fixed price, agreed before anything starts. If your problem isn't on this list, ask anyway."
        />

        <ul className="mt-14 grid gap-4 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
          {site.services.map((service, index) => (
            <Reveal
              as="li"
              key={service.title}
              delay={Math.min(index, 3) * 0.07}
              className="group hover:border-accent/30 lift flex flex-col rounded-2xl border border-line bg-surface p-7 transition-all duration-500 hover:bg-surface-hover hover:shadow-[0_24px_70px_-45px_var(--glow-strong)]"
            >
              <h3 className="font-display group-hover:text-accent text-xl font-bold tracking-tight transition-colors duration-300">
                {service.title}
              </h3>

              <p className="text-muted mt-4 flex-1 leading-relaxed">
                {service.description}
              </p>

              <ul className="mt-6 flex flex-wrap gap-1.5 border-t border-line-soft pt-5">
                {service.deliverables.map((item) => (
                  <li
                    key={item}
                    className="text-muted bg-chip rounded-md px-2.5 py-1 font-mono text-[11px]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}

          {/* The list is five items in a three-column grid — this fills the gap
              with the next step rather than dead space. */}
          <Reveal
            as="li"
            delay={0.28}
            className="border-accent/25 from-accent/10 flex flex-col justify-between rounded-2xl border bg-gradient-to-br to-transparent p-7"
          >
            <h3 className="font-display text-xl font-bold tracking-tight text-balance">
              Not sure which one you need?
            </h3>
            <p className="text-muted mt-4 flex-1 leading-relaxed">
              Send me what you&rsquo;re trying to fix. I&rsquo;ll tell you the
              smallest thing that would work.
            </p>
            <a
              href="#contact"
              className="text-accent hover:text-accent-dim mt-6 inline-flex font-mono text-xs tracking-wider uppercase transition-colors"
            >
              Ask a question →
            </a>
          </Reveal>
        </ul>
      </div>
    </section>
  );
}
