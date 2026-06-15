/**
 * Per-card color treatments for the Suggested Pairings grid.
 *
 * Instead of one palette flipped by a global light/dark toggle, every card gets
 * its own solid-color field — a deliberate mix of light-text-on-dark and
 * dark-text-on-light. The light/dark treatment is implicit in each theme
 * (whether `fg` is lighter or darker than `bg`).
 *
 * Colors are drawn from the Mindful ramps (`lib/mindful-palettes.ts`) plus hues
 * pulled from the pal1–5 references in `ideas/`. To grow or retune the look,
 * edit the `C` palette and the `CARD_THEMES` array here — nothing else.
 */

export interface CardTheme {
  bg: string; // solid card field
  fg: string; // title (display font)
  muted: string; // subtitle (text font)
  accent: string; // pairing label at the bottom
}

/** The limited source palette. Named hexes, reused across themes. */
const C = {
  // grounds — dark
  forestRoast: "#40534C",
  eclipse: "#1A3636",
  limedSpruce: "#2E434F",
  botticelli: "#345463",
  matcha: "#677D6A",
  darkPurple: "#30253E",
  parchmentInk: "#181614", // Mindful Writer's Parchment 950
  // grounds — light
  parchment: "#FBF8F3", // Parchment 50
  almond: "#D6BD98",
  butter: "#F2D6A1",
  navajo: "#FBE1B5",
  peacockMist: "#DEE6EA", // Peacock 100
  // grounds — vivid
  oriolesField: "#FB6632", // Orioles 400
  // text — light
  cream: "#F0E4D3", // Parchment 100
  mist: "#DCE7E6", // Aquaverde 100
  grey: "#E5E6E6", // Neverything 100
  // text — dark
  ink: "#2C2824", // Parchment 900
  inkOrange: "#2C0E03", // Orioles 950
  // accents
  orioles: "#E34712", // Orioles 500
  tuscan: "#F1A805",
  fadedOrange: "#F89254",
  sage: "#C3C88C",
  saddle: "#84572F",
  peacock: "#225870", // Peacock 700
};

/**
 * ~10 curated themes, alternating treatments so each row of four shows variety.
 * Muted/accent values are hand-tuned to stay legible on their field.
 */
export const CARD_THEMES: CardTheme[] = [
  // light-on-dark
  { bg: C.forestRoast, fg: C.cream, muted: "#AEBAB0", accent: C.tuscan },
  // dark-on-light
  { bg: C.almond, fg: C.ink, muted: "#6E5F49", accent: C.saddle },
  // light-on-dark
  { bg: C.eclipse, fg: C.mist, muted: "#8AA4A1", accent: C.fadedOrange },
  // dark-on-light
  { bg: C.butter, fg: C.ink, muted: "#7C6A45", accent: C.orioles },
  // light-on-dark
  { bg: C.limedSpruce, fg: C.peacockMist, muted: "#93AAB6", accent: C.fadedOrange },
  // dark-on-light
  { bg: C.parchment, fg: C.ink, muted: "#585148", accent: C.orioles },
  // light-on-dark
  { bg: C.darkPurple, fg: C.grey, muted: "#9C90AB", accent: C.sage },
  // dark-on-vivid
  { bg: C.oriolesField, fg: C.inkOrange, muted: "#7A2A12", accent: C.parchment },
  // light-on-dark
  { bg: C.botticelli, fg: C.mist, muted: "#92A8B3", accent: C.tuscan },
  // light-on-dark
  { bg: C.matcha, fg: C.cream, muted: "#C3CBBE", accent: C.butter },
  // dark-on-light
  { bg: C.navajo, fg: C.ink, muted: "#7E6B4A", accent: C.peacock },
];

export function themeForIndex(i: number): CardTheme {
  return CARD_THEMES[i % CARD_THEMES.length];
}

/** Fixed dark-neutral page chrome behind the grid. */
export const PAGE_THEME: CardTheme = {
  bg: "#14130F", // warm near-black ground
  fg: C.cream,
  muted: "#8A8678",
  accent: C.orioles,
};
