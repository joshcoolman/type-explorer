/**
 * The Google Fonts `/Expressive` mood layer — the 20 "feeling" tags surfaced as
 * clickable pills on font cards. A pill links to `/?tag=<slug>`, which focuses the
 * Fonts grid on fonts carrying that feeling.
 *
 * Leaves are single words and unique, so the slug is just the lowercased name —
 * no stored map, the two directions can't drift (cf. lib/slug.ts).
 *
 * NOTE: this list mirrors `EXPRESSIVE` in `scripts/build-pairing-library.mjs`
 * (and the mapping in `scripts/build-catalog.mjs`). Keep them in step.
 */
export const FEELINGS = [
  "Active",
  "Artistic",
  "Awkward",
  "Business",
  "Calm",
  "Childlike",
  "Competent",
  "Cute",
  "Excited",
  "Fancy",
  "Futuristic",
  "Happy",
  "Innovative",
  "Loud",
  "Playful",
  "Rugged",
  "Sincere",
  "Sophisticated",
  "Stiff",
  "Vintage",
] as const;

const BY_SLUG = new Map(FEELINGS.map((name) => [name.toLowerCase(), name]));

/** Feeling name → URL slug ("Cute" → "cute"). */
export function feelingSlug(name: string): string {
  return name.toLowerCase();
}

/** URL slug → canonical feeling name, or null if it isn't one of the 20. */
export function feelingFromSlug(slug: string): string | null {
  return BY_SLUG.get(slug.trim().toLowerCase()) ?? null;
}

/** Display label for a pill / chip. Names are already capitalized. */
export function feelingLabel(name: string): string {
  return name;
}
