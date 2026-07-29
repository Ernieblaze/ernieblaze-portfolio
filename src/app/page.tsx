import { About } from "@/components/about";
import { Ambient } from "@/components/ambient";
import { Contact } from "@/components/contact";
import { Hero } from "@/components/hero";
import { Services } from "@/components/services";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Work } from "@/components/work";
import { getPublishedProjectsSafe } from "@/lib/projects";
import { site } from "@/lib/site";

/**
 * Rendered per request, reading projects straight from Supabase.
 *
 * Deliberately not prerendered at build time: a portfolio's build must not
 * depend on a database being reachable, or a config gap or a transient
 * Supabase blip turns into a failed deploy. The upside is that whatever is in
 * the dashboard is what's on the site, always — no cache to invalidate and no
 * stale content to explain.
 */
export const dynamic = "force-dynamic";

export default async function Home() {
  const projects = await getPublishedProjectsSafe();

  // Structured data so search results and rich previews name the right person.
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: site.url,
    email: `mailto:${site.email}`,
    jobTitle: site.role,
    sameAs: site.socials.map((social) => social.href),
    knowsAbout: site.skills,
  };

  return (
    <>
      <Ambient />
      <SiteHeader />

      <main>
        <Hero projects={projects} />
        <Work projects={projects} />
        <About />
        <Services />
        <Contact />
      </main>

      <SiteFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
    </>
  );
}
