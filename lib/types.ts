export type FontCategory =
  | "serif"
  | "sans-serif"
  | "display"
  | "monospace"
  | "handwriting";

export interface FontAxis {
  tag: string; // e.g. "wght", "opsz", "ital", "SOFT", "WONK"
  min: number;
  max: number;
  defaultValue: number;
}

export interface FontFamily {
  family: string; // "Bricolage Grotesque"
  category: FontCategory;
  variants: string[]; // ["200", "300", ..., "800italic", "regular", "italic"]
  axes?: FontAxis[]; // variable-font axes, if any
  subsets: string[];
  popularityRank: number; // index in the popularity-sorted response (0-based)
  trendingRank?: number; // index in the trending-sorted response
  lastModified: string;
}

export interface Catalog {
  fetchedAt: string; // ISO timestamp of the last successful fetch
  families: FontFamily[];
}

/**
 * A curated display + text pairing shown on the home page. Sourced from
 * `content/suggested-pairings.json`. `monovoice` marks a same-family "pairing"
 * (one font carrying both roles).
 */
export interface Pairing {
  id: string;
  label: string;
  heading: string;
  body: string;
  monovoice: boolean;
}
