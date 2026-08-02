import { About } from "@/components/about";
import { Ambient } from "@/components/ambient";
import { Contact } from "@/components/contact";
import { Hero } from "@/components/hero";
import { Services } from "@/components/services";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Work } from "@/components/work";
import { getPublishedProjectsSafe } from "@/lib/projects";
import { getSiteContentSafe } from "@/lib/site-content";

/**
 * Prerendered and cached, so a visitor is never the one waiting on Supabase.
 *
 * The build still must not depend on the database being reachable — a config
 * gap or a transient blip cannot be allowed to fail a deploy. That guarantee
 * comes from `getPublishedProjectsSafe`, which returns an empty list instead of
 * throwing, so the page renders either way. `force-dynamic` is not needed for
 * it, and cost every visitor a round trip to Frankfurt to buy nothing.
 *
 * Freshness is not on this timer in practice: every mutation calls
 * `revalidatePath`, so dashboard edits are live immediately. The window below
 * is only a backstop for changes made outside the app.
 */
export const revalidate = 300;

export default async function Home() {
  // Both degrade to defaults rather than throwing, so a database problem shows
  // an emptier page instead of an error one.
  const [projects, content] = await Promise.all([
    getPublishedProjectsSafe(),
    getSiteContentSafe(),
  ]);

  // Structured data so search results and rich previews name the right person.
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: content.name,
    url: content.url,
    email: `mailto:${content.email}`,
    jobTitle: content.role,
    sameAs: content.socials.map((social) => social.href),
    knowsAbout: content.skills,
  };

  return (
    <>
      <Ambient />
      <SiteHeader content={content} />

      <main>
        <Hero projects={projects} content={content} />
        <Work projects={projects} />
        <About content={content} />
        <Services content={content} />
        <Contact content={content} />
      </main>

      <SiteFooter content={content} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
    </>
  );
}
