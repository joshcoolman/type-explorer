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

/** A Google /Expressive mood tag — leaf name ("Cute") + 0–100 weight. */
export interface FontFeeling {
  name: string;
  weight: number;
}

export interface FontFamily {
  family: string; // "Bricolage Grotesque"
  category: FontCategory;
  variants: string[]; // ["200", "300", ..., "800italic", "regular", "italic"]
  axes?: FontAxis[]; // variable-font axes, if any
  feelings?: FontFeeling[]; // Google /Expressive mood tags, strongest first
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
 * The global "typographic voice" — one set of words applied to every card, so
 * fonts and pairings can be judged against the same copy. Empty fields fall back
 * to each card's own sample. Shown on Explorer specimens (all three fields) and
 * pairing cards (title + subtitle; paragraph unused there).
 */
export interface VoiceCopy {
  title: string;
  subtitle: string;
  paragraph: string;
}

/**
 * Which voice elements are shown on cards. A global, persisted preference toggled
 * by the eyeballs in the voice editor. At least one is always visible. Paragraph
 * is off by default — the compact title+subtitle card is the default look.
 */
export interface VoiceVisibility {
  title: boolean;
  subtitle: boolean;
  paragraph: boolean;
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
