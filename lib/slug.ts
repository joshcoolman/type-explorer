/**
 * Font-family ↔ URL-slug conversion for the pairing routes. The pairing library
 * is keyed by family name (e.g. "Playfair Display"); a slug is its lowercased,
 * hyphenated form ("playfair-display"). `familyForSlug` reverses the mapping by
 * slugifying each known family and matching — so the slug never has to be stored
 * and the two directions can't drift.
 */

export function slugify(family: string): string {
  return family
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Resolve a slug back to its family name among `families`, or null if unknown. */
export function familyForSlug(
  slug: string,
  families: Iterable<string>,
): string | null {
  for (const family of families) {
    if (slugify(family) === slug) return family;
  }
  return null;
}
