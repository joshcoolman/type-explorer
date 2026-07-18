// Not marked "use client": nothing here touches the DOM, and `/api/pairings`
// needs `groupedPairingsFor` on the server. Client components import it exactly
// as before — an unmarked module is shared, not server-only.
import type { Pairing } from "./types";

/**
 * The static pairing library the magic-icon feature reads from, generated
 * offline by `scripts/build-pairing-library.mjs` (curated dumps + fontjoy
 * contrast-distance neighbours). Keyed by source family name.
 *
 * The JSON (~430 KB) is loaded lazily on first use so it stays out of the main
 * explorer bundle — only fonts with an entry ever show the magic icon.
 */

export interface CuratedPartner {
  family: string;
  /** The partner's role relative to the source font. */
  role: "display" | "text";
}

export interface SuggestedPartner {
  family: string;
  score: number;
  /** A short, human-readable rationale, e.g. "Both calm; serif × geometric sans". */
  why?: string;
}

/** A renderable pairing, optionally carrying its rationale (suggested only). */
export type LibraryPairing = Pairing & { why?: string };

export interface LibraryEntry {
  category: string | null;
  curated: CuratedPartner[];
  suggested: SuggestedPartner[];
}

export type PairingLibrary = Record<string, LibraryEntry>;

let cache: PairingLibrary | null = null;
let pending: Promise<PairingLibrary> | null = null;

/** Load (once) and return the full library. */
export function loadPairingLibrary(): Promise<PairingLibrary> {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = import("../content/pairing-library.json").then((mod) => {
      cache = (mod.default ?? mod) as PairingLibrary;
      return cache;
    });
  }
  return pending;
}

/**
 * Group an entry into renderable pairings — curated (human-picked) and suggested
 * (algorithmic contrast). Each carries a stable id so favoriting dedupes with the
 * rest of the app; a curated pairing is never repeated in the suggested list.
 */
export function groupedPairingsFor(
  source: string,
  entry: LibraryEntry,
): { curated: LibraryPairing[]; suggested: LibraryPairing[] } {
  const seen = new Set<string>();

  const make = (heading: string, body: string): LibraryPairing | null => {
    const id = `${heading}|${body}`.toLowerCase();
    if (seen.has(id)) return null;
    seen.add(id);
    return { id, label: `${heading} & ${body}`, heading, body, monovoice: false };
  };

  // Curated: honour the stored role so display/text land the right way round.
  const curated: LibraryPairing[] = [];
  for (const c of entry.curated) {
    const p = c.role === "display" ? make(c.family, source) : make(source, c.family);
    if (p) curated.push(p);
  }
  // Algorithmic: source leads as the display voice, partner as the text voice.
  const suggested: LibraryPairing[] = [];
  for (const s of entry.suggested) {
    const p = make(source, s.family);
    if (p) suggested.push({ ...p, why: s.why });
  }

  return { curated, suggested };
}
