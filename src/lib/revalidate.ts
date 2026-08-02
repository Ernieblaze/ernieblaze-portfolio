import "server-only";

import { revalidatePath } from "next/cache";

/**
 * Drops the cached public pages after a write.
 *
 * The public site is statically rendered and revalidated on demand (see
 * `src/app/page.tsx`). That makes it fast, but it also means a save is not
 * visible until something invalidates the cache — without this call the
 * dashboard appears to work and the site silently shows the old copy for the
 * length of the revalidate window.
 *
 * Every mutating route must call it. Keeping the path list in one place is the
 * point: a new cached page gets added here once, rather than being forgotten in
 * three separate handlers.
 */
export function revalidatePublicPages(slug?: string) {
  revalidatePath("/");
  revalidatePath("/sitemap.xml");

  // Case-study pages are cached per slug, so the generic path does not cover
  // them. An edit that renames a slug should refresh both, hence the argument
  // being the *old* slug at the call site where they differ.
  if (slug) revalidatePath(`/work/${slug}`);
}
