/**
 * Near-miss slug resolution.
 *
 * The agent contract says "guessing is safe and encouraged." That is only true
 * if a slug an agent reasonably *would* guess actually lands. `source-serif` for
 * Source Serif 4, `playfair` for Playfair Display, a one-character typo in a long
 * family name — under exact matching each of those silently drops a whole card,
 * and that residual risk is exactly what an agent spends a verification
 * round-trip to buy down. Making the guess land is what removes the round-trip.
 *
 * Four tiers, first hit wins. Tiers 3 and 4 scan the whole index, but only ever
 * on a miss, and `/compose` is served with a one-year cache header.
 *
 * Depends only on `./slug` and the `FontFamily` type — self-contained enough to
 * lift into another project that needs forgiving slug lookup.
 */

import { slugify } from "./slug";
import type { FontFamily } from "./types";

/** Below this length, an edit-distance match is too likely to be a coincidence. */
const MIN_FUZZY_LENGTH = 5;
/** Absolute edit-distance ceiling. */
const MAX_DISTANCE = 2;
/** Distance may not exceed this share of the input — keeps short inputs honest. */
const MAX_DISTANCE_RATIO = 0.25;

/**
 * Resolve a slug to a family, tolerating near misses.
 *
 * `index` is the memoized slug -> family map from `lib/font-index.ts`, keyed by
 * `slugify(family.family)`.
 */
export function matchSlug(
  input: string,
  index: Map<string, FontFamily>,
): FontFamily | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;

  // 1. Exact — the common case, and the only one that costs nothing.
  const exact = index.get(raw);
  if (exact) return exact;

  // 2. Normalized: underscores, stray punctuation, doubled hyphens.
  const normalized = slugify(raw);
  if (normalized && normalized !== raw) {
    const hit = index.get(normalized);
    if (hit) return hit;
  }
  if (!normalized) return null;

  // 3. Prefix expansion: `source-serif` -> `source-serif-4`. Requires a hyphen
  //    boundary so `not` can't reach `noto-sans`.
  const prefix = `${normalized}-`;
  let best: FontFamily | null = null;
  for (const [slug, family] of index) {
    if (!slug.startsWith(prefix)) continue;
    if (!best || family.popularityRank < best.popularityRank) best = family;
  }
  if (best) return best;

  // 4. Edit distance, guarded. This is what keeps `helvetica` — not a Google
  //    font at all — from landing on something arbitrary.
  if (normalized.length < MIN_FUZZY_LENGTH) return null;
  const ceiling = Math.min(
    MAX_DISTANCE,
    Math.floor(normalized.length * MAX_DISTANCE_RATIO),
  );
  if (ceiling < 1) return null;

  let bestDistance = ceiling + 1;
  for (const [slug, family] of index) {
    // Length alone can rule a candidate out before doing the real work.
    if (Math.abs(slug.length - normalized.length) > ceiling) continue;
    const distance = editDistance(normalized, slug, ceiling);
    if (distance > ceiling) continue;
    if (
      distance < bestDistance ||
      (distance === bestDistance &&
        best !== null &&
        family.popularityRank < best.popularityRank)
    ) {
      bestDistance = distance;
      best = family;
    }
  }
  return best;
}

/**
 * Levenshtein distance, abandoning early once every cell in a row exceeds
 * `ceiling` — the answer can only grow from there, and the caller only cares
 * whether it stays within the ceiling.
 */
function editDistance(a: string, b: string, ceiling: number): number {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > ceiling) return ceiling + 1;
    prev = curr.slice();
  }
  return prev[b.length];
}
