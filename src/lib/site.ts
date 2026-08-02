import type { SiteContent } from "./types";

/**
 * Default copy for the public site.
 *
 * These are the fallbacks, not the live values. The dashboard writes overrides
 * to Supabase and `getSiteContentSafe` merges them over this object, so an
 * unreachable database or an untouched field still renders real content rather
 * than a blank section. Editing this file changes what a fresh install starts
 * with — to change the running site, use /admin.
 */
export const site: SiteContent = {
  name: "Ernie Blaze",
  /*
   * The address the site is actually reachable at.
   *
   * This feeds canonical tags, the sitemap and Open Graph images, so pointing
   * it at a domain that has not been connected yet is worse than useless: it
   * tells search engines the real page is somewhere that does not resolve, and
   * every shared link loses its preview card because the image 404s.
   *
   * Change it under /admin → Site content → Your details on the day the custom
   * domain starts resolving, not before.
   */
  domain: "ernieblaze-portfolio.vercel.app",
  url: "https://ernieblaze-portfolio.vercel.app",
  role: "Freelance web developer",
  email: "hello@ernieblaze.dev",
  location: "Remote · working across UK & US hours",

  tagline:
    "I build clean, modern websites that help businesses stand out and convert.",

  /** Shown under the hero headline. Two sentences, no more. */
  heroSupport:
    "Independent developer working with founders and small teams. You get the site, the copy structure, and the analytics to prove it worked.",

  /** Availability chip in the header and contact section. */
  availability: {
    open: true,
    label: "Available for new projects",
    detail: "Taking on two builds for September",
  },

  about: {
    heading: "I make the website the part of the business that pulls its weight.",
    paragraphs: [
      "I'm Ernie, a freelance developer. I've spent the last five years building sites for people who need them to do a specific job — book appointments, sell subscriptions, get demo requests — and I measure whether they did it.",
      "I work solo and I work directly with you. No account manager, no handoff to a junior after the pitch. You'll see the site running on a real URL within the first week, and you'll keep the code.",
      "Most projects run two to four weeks. If a template genuinely serves you better than a custom build, I'll tell you that before you pay me anything.",
    ],
    /** Drop a real photo at public/ernie.jpg and set this to "/ernie.jpg". */
    photo: null,
    photoAlt: "Ernie Blaze",
  },

  skills: [
    "Next.js",
    "React",
    "TypeScript",
    "Tailwind CSS",
    "Framer Motion",
    "Node.js",
    "Shopify",
    "Stripe",
    "Core Web Vitals",
    "Technical SEO",
    "Accessibility",
    "Vercel",
  ],

  /** Numbers in the hero. Replace with your real ones. */
  stats: [
    { value: "5 yrs", label: "Building for clients" },
    { value: "30+", label: "Sites shipped" },
    { value: "98", label: "Median Lighthouse score" },
  ],

  services: [
    {
      title: "Custom website development",
      description:
        "A site built from scratch for your business, not a theme with your logo dropped in. Fast, accessible, and yours to keep.",
      deliverables: ["Design & build", "CMS or admin panel", "Deployment"],
    },
    {
      title: "Website redesigns",
      description:
        "You have a site. It's dated, slow, or nobody converts on it. I rebuild it around the one action you actually need visitors to take.",
      deliverables: ["Audit", "Rebuild", "Redirect mapping"],
    },
    {
      title: "High-converting landing pages",
      description:
        "One page, one offer, one measurable goal. Structured copy, honest proof, and a form that people finish.",
      deliverables: ["Copy structure", "Build", "A/B-ready setup"],
    },
    {
      title: "Performance & SEO",
      description:
        "Core Web Vitals into the green, metadata done properly, and structured data so search engines and social cards render you correctly.",
      deliverables: ["Vitals fixes", "Technical SEO", "Before/after report"],
    },
    {
      title: "Ongoing support",
      description:
        "A monthly retainer for changes, new pages, and keeping dependencies current — so the site doesn't quietly rot after launch.",
      deliverables: ["Monthly changes", "Monitoring", "Priority response"],
    },
  ],

  /** Replace the placeholder handles with your real profiles. */
  socials: [
    { name: "X", handle: "@ernieblaze", href: "https://x.com/ernieblaze" },
    {
      name: "GitHub",
      handle: "ernieblaze",
      href: "https://github.com/ernieblaze",
    },
    {
      name: "LinkedIn",
      handle: "in/ernieblaze",
      href: "https://linkedin.com/in/ernieblaze",
    },
  ],

  nav: [
    { label: "Work", href: "#work" },
    { label: "About", href: "#about" },
    { label: "Services", href: "#services" },
    { label: "Contact", href: "#contact" },
  ],
};

export type Site = SiteContent;
