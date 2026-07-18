/**
 * Slug -> family lookup over the static catalog.
 *
 * `lib/slug.ts` resolves a slug by slugifying candidates and comparing, which is
 * right for the ~500-entry pairing library but is a linear scan over ~1,900
 * families here — and `/compose` does it once per named font, per request. So the
 * map is built once per process and memoized.
 */

import { getCatalog } from "./catalog";
import { slugify } from "./slug";
import type { FontFamily } from "./types";

let index: Map<string, FontFamily> | null = null;

export async function getFontIndex(): Promise<Map<string, FontFamily>> {
  if (index) return index;
  const catalog = await getCatalog();
  const map = new Map<string, FontFamily>();
  for (const family of catalog.families) {
    // First writer wins: the catalog is popularity-ordered, so on the rare slug
    // collision the better-known family is the one an agent meant.
    const slug = slugify(family.family);
    if (!map.has(slug)) map.set(slug, family);
  }
  index = map;
  return index;
}

/** A resolver suitable for `parseComposeParams`. */
export async function getFontResolver(): Promise<(slug: string) => FontFamily | null> {
  const map = await getFontIndex();
  return (slug: string) => map.get(slug.trim().toLowerCase()) ?? null;
}
