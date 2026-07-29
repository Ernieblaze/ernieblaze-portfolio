import { About } from "@/components/about";
import { Ambient } from "@/components/ambient";
import { Contact } from "@/components/contact";
import { Hero } from "@/components/hero";
import { Services } from "@/components/services";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Work } from "@/components/work";
import { getPublishedProjects } from "@/lib/projects";
import { site } from "@/lib/site";

export default async function Home() {
  const projects = await getPublishedProjects();

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
