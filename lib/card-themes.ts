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

import type { Rgb } from "./color";
import { note, type Note } from "./compose-notes";
import {
  contrastRatio,
  ensureContrast,
  isDark,
  luminance,
  mix,
  parseHex,
  toHex,
} from "./color";

export interface CardTheme {
  bg: string; // solid card field
  fg: string; // title (display font)
  muted: string; // subtitle (text font)
  accent: string; // pairing label at the bottom
  /**
   * Per-element color slots, used only by `/compose`.
   *
   * The four palette roles above are a *palette*, not a type spec: `fg` carries
   * the title and `muted` carries both the subtitle and the paragraph. That
   * collapses three typographic roles into two color slots, so "make the subheads
   * red" has no expressible answer without dragging the body copy along.
   *
   * These name every painted element directly. Any one of them accepts a hex, so
   * an agent can place a specific color on a specific element; omitted ones are
   * filled by `resolveTheme`. Optional throughout — no curated theme sets them.
   */
  title?: string;
  subtitle?: string;
  paragraph?: string;
  /** The hairline above the font-name line. */
  rule?: string;
  /** The font-name line itself. */
  label?: string;
}

/**
 * A theme with every paintable slot filled — what the render layer consumes.
 *
 * `CardTheme` is what an agent (or a curated palette) *states*; this is what
 * actually gets painted. Keeping them separate is what lets the components read
 * `theme.subtitle` unconditionally instead of re-deciding a fallback at each use
 * site, which is how the subtitle and paragraph ended up sharing one color.
 */
export interface ResolvedCardTheme {
  bg: string;
  fg: string;
  muted: string;
  accent: string;
  title: string;
  subtitle: string;
  paragraph: string;
  rule: string;
  label: string;
}

/** Where a rendered color came from. */
export type ColorSource =
  /** The URL named this hex. Rendered exactly, contrast bar or not. */
  | "stated"
  /** We computed it — and therefore clamped it for legibility. */
  | "derived"
  /** It inherits another role: `from:fg`, `from:accent`, `from:muted`. */
  | `from:${string}`;

export interface ColorProvenance {
  hex: string;
  source: ColorSource;
}

/** Which role each slot falls back to when the URL doesn't name it. */
const INHERITS: Partial<Record<keyof ResolvedCardTheme, string>> = {
  title: "fg",
  subtitle: "accent",
  paragraph: "muted",
  label: "accent",
};

/**
 * Pair every painted slot with where its value came from.
 *
 * This is what `/compose.json` reports and the one thing the HTML handoff cannot
 * express: `#2F6E6A` on a card might be a brand color the client chose or a value
 * we filled, and a developer needs to know which to pin.
 *
 * Kept separate from `resolveTheme` on purpose — the render path never needs
 * provenance and shouldn't pay to compute it.
 *
 * Note `source` names the *origin*, not an equality claim: a `from:accent`
 * subtitle is routinely darker than the accent, because derived values are
 * clamped for legibility while a stated accent is not.
 */
export function themeProvenance(
  resolved: ResolvedCardTheme,
  stated: readonly string[],
): Record<keyof ResolvedCardTheme, ColorProvenance> {
  const statedSet = new Set(stated);
  const roles = Object.keys(resolved) as (keyof ResolvedCardTheme)[];

  return Object.fromEntries(
    roles.map((role) => {
      const hex = resolved[role];
      if (statedSet.has(role)) return [role, { hex, source: "stated" as const }];
      const inherited = INHERITS[role];
      // Only claim inheritance when the source role wasn't stated either — if the
      // user gave `accent`, the subtitle's origin is that stated accent, which is
      // more useful to report than a bare "derived".
      if (inherited) return [role, { hex, source: `from:${inherited}` as const }];
      return [role, { hex, source: "derived" as const }];
    }),
  ) as Record<keyof ResolvedCardTheme, ColorProvenance>;
}

/**
 * Fill every unstated slot.
 *
 * The split here is deliberate, and it is the fix for palettes that came out
 * muddy. **Dominant** roles — the text you actually read — are never computed by
 * blending the field into the ink: averaging two colors trends to grey, which is
 * exactly how `mix(fg, bg, 0.42)` produced the same dull tone for both the
 * subtitle and the paragraph. Instead the subtitle takes the *accent*, so the one
 * color the agent chose with intent does visible work, and the paragraph takes
 * `muted`, which now comes from a hand-tuned curated palette rather than
 * arithmetic.
 *
 * **Ancillary** chrome — the hairline, the font-name line — is fine to derive,
 * since nothing rests on it. Both come off the accent so the card reads as one
 * idea rather than a neutral box with a colored word in it.
 *
 * Anything stated explicitly is passed through untouched.
 */
export function resolveTheme(theme: CardTheme): ResolvedCardTheme {
  const bg = parseHex(theme.bg)!;
  const accent = parseHex(theme.accent)!;

  return {
    bg: theme.bg,
    fg: theme.fg,
    muted: theme.muted,
    accent: theme.accent,
    title: theme.title ?? theme.fg,
    // The accent, pushed only as far as body-size legibility requires. This is
    // the ambition: a subtitle that carries the palette's hue instead of a grey.
    subtitle: theme.subtitle ?? toHex(ensureContrast(accent, bg, 4.5)),
    paragraph: theme.paragraph ?? theme.muted,
    // A tinted hairline, mostly field with a trace of accent.
    rule: theme.rule ?? toHex(mix(accent, bg, 0.72)),
    label: theme.label ?? theme.accent,
  };
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

/**
 * The default dark-neutral page chrome behind the grid. These literal hexes are
 * the *defaults*; they're mirrored into the `--page-*` CSS variables in
 * globals.css and are what the Colors-page editor restores to. The live values
 * the app actually renders come through `PAGE_THEME` below (the CSS vars), which
 * `CardThemeProvider` can override at runtime.
 */
export const PAGE_THEME_DEFAULT: CardTheme = {
  bg: "#212121", // neutral grey ground (no hue) — matches globals.css --page-bg
  fg: C.cream,
  muted: "#8A8678",
  accent: C.orioles,
};

/**
 * Page chrome as the app reads it — CSS-variable references, not literals, so
 * user customization (or none) flows through one place. Defaults live in
 * globals.css `:root` (`--page-*`); `CardThemeProvider` writes overrides onto the
 * document root. Every chrome consumer uses this, so editing the vars repaints
 * the whole shell.
 */
export const PAGE_THEME: CardTheme = {
  bg: "var(--page-bg)",
  fg: "var(--page-fg)",
  muted: "var(--page-muted)",
  accent: "var(--page-accent)",
};

/**
 * The selected/active highlight for interactive page-chrome controls (filter
 * pills, toggles). Warm amber/gold. Distinct from `PAGE_THEME.accent`
 * (orange-red), reserved for small-type accents like the page eyebrow.
 */
export const HIGHLIGHT_DEFAULT = "#e8c07a";
export const HIGHLIGHT = "var(--page-highlight)";

/** Default page-chrome values keyed by role — drives the editor + reset. */
export const PAGE_CHROME_DEFAULTS = {
  bg: PAGE_THEME_DEFAULT.bg,
  fg: PAGE_THEME_DEFAULT.fg,
  muted: PAGE_THEME_DEFAULT.muted,
  accent: PAGE_THEME_DEFAULT.accent,
  highlight: HIGHLIGHT_DEFAULT,
} as const;

/** The page-chrome role keys, in editor display order. */
export type PageChromeKey = keyof typeof PAGE_CHROME_DEFAULTS;

export interface PageChrome {
  bg: string;
  fg: string;
  muted: string;
  accent: string;
  /** Hairlines and panel borders. */
  rule: string;
}

/**
 * Page chrome for `/compose` — resolved per-URL, deliberately NOT `PAGE_THEME`.
 *
 * `PAGE_THEME` resolves to `var(--page-*)`, which `CardThemeProvider` overwrites
 * from the *viewer's* localStorage. That's right for the app's own pages and wrong
 * for a composed one: the whole promise of a composed URL is that the person you
 * send it to sees what you saw.
 *
 * The default is *derived from the cards* rather than fixed. A fixed black field
 * makes a light composition impossible — an agent asked for "show me this as a
 * light theme" could change the cards and be stranded with a black viewport around
 * them. Deriving means the page is coherent with the cards by default, and the
 * `page` param exists for when the agent wants something else.
 */
export function derivePageChrome(card: CardTheme): PageChrome {
  const cardBg = parseHex(card.bg)!;
  const dark = isDark(cardBg);

  // Cards should read as raised panels: the field goes *away* from the card, so a
  // dark composition sits on near-black and a light one on a soft grey. Tinted
  // toward the card's own hue rather than neutral, so the page never looks like a
  // different design system from the thing sitting on it.
  const pole: Rgb = dark ? { r: 0, g: 0, b: 0 } : { r: 20, g: 18, b: 16 };
  const bg = mix(cardBg, pole, dark ? 0.55 : 0.08);

  const fgSeed = parseHex(card.fg)!;
  const fg = ensureContrast(fgSeed, bg, 4.5);
  const muted = ensureContrast(mix(fg, bg, 0.45), bg, 4.5);
  const accent = ensureContrast(parseHex(card.accent)!, bg, 3);

  return {
    bg: toHex(bg),
    fg: toHex(fg),
    muted: toHex(muted),
    accent: toHex(accent),
    // A hairline that reads as a seam, not a border: a small step off the field.
    rule: toHex(mix(bg, fg, 0.14)),
  };
}

/**
 * Complete an agent-supplied page palette, deriving whatever it left out and
 * contrast-checking the rest — the same contract as `completeTheme` for cards.
 */
export function completePageChrome(
  partial: Partial<PageChrome>,
  fallback: PageChrome,
): { chrome: PageChrome; notes: Note[] } {
  const notes: Note[] = [];
  const bgHex = partial.bg ?? fallback.bg;
  const bg = parseHex(bgHex)!;

  let fg = partial.fg ? parseHex(partial.fg)! : null;
  if (!fg) fg = parseHex(isDark(bg) ? C.cream : C.ink)!;

  const accent = partial.accent
    ? parseHex(partial.accent)!
    : parseHex(fallback.accent)!;
  const muted = partial.muted ? parseHex(partial.muted)! : mix(fg, bg, 0.45);

  const nudge = (role: keyof PageChrome, value: Rgb, target: number): Rgb => {
    const fixed = ensureContrast(value, bg, target);
    if (toHex(fixed) !== toHex(value) && partial[role]) {
      notes.push(
        note(
          "contrast_below_bar",
          "warn",
          role,
          `page: ${role} ${toHex(value)} fell short of ${target}:1 on the page background — adjusted to ${toHex(fixed)}`,
        ),
      );
    }
    return fixed;
  };

  const resolvedFg = nudge("fg", fg, 4.5);
  return {
    chrome: {
      bg: toHex(bg),
      fg: toHex(resolvedFg),
      muted: toHex(nudge("muted", muted, 4.5)),
      accent: toHex(nudge("accent", accent, 3)),
      rule: toHex(mix(bg, resolvedFg, 0.14)),
    },
    notes,
  };
}

// ---------------------------------------------------------------------------
// Agent surface: moods and bring-your-own palettes
// ---------------------------------------------------------------------------

/**
 * A mood is an *ordered subset* of `CARD_THEMES`, not a new palette. An agent
 * that knows the feel it wants but not our indices says `mood=warm`; the cards
 * then walk that subset, so a multi-card page still varies instead of repeating
 * one field. Every value here is an index into `CARD_THEMES` above — moods can
 * never introduce an unvetted color.
 */
export const MOODS = {
  subtle: [5, 8, 4, 2],
  bold: [7, 3, 0, 6],
  warm: [1, 3, 10, 7],
  cool: [2, 4, 8, 6],
} as const;

export type Mood = keyof typeof MOODS;

export function isMood(value: string): value is Mood {
  return Object.prototype.hasOwnProperty.call(MOODS, value);
}

/** The theme sequence a page cycles through, given an optional mood. */
export function themesForMood(mood: Mood | null): CardTheme[] {
  if (!mood) return CARD_THEMES;
  return MOODS[mood].map((i) => CARD_THEMES[i]);
}

/**
 * Complete a partially-specified palette, routing bring-your-own color *through*
 * our taste rather than around it.
 *
 * The rules encode where hand-built palettes actually fail. People know their
 * background and their brand accent; nobody knows their "muted" — so muted is
 * derived by default, and it is validated at 4.5:1 because it renders at body
 * sizes (the classic derived-palette failure is a muted that looks fine in a
 * swatch and is unreadable in a paragraph). Accent only needs 3:1 because it is
 * used at display sizes and on the footer meta line.
 *
 * Every nudge is reported, so `/compose` can tell the agent what it changed.
 */
export function completeTheme(partial: Partial<CardTheme>): {
  theme: CardTheme;
  notes: Note[];
} {
  const notes: Note[] = [];
  const bgHex = partial.bg ?? PAGE_THEME_DEFAULT.bg;
  const bg = parseHex(bgHex)!;

  // fg: given, or the legible pole of the field.
  let fg = partial.fg ? parseHex(partial.fg)! : null;
  if (!fg) fg = parseHex(isDark(bg) ? C.cream : C.ink)!;

  // accent: given, or borrowed from the curated theme whose field is closest in
  // lightness — so an unspecified accent still comes from a hand-tuned pair.
  let accent = partial.accent ? parseHex(partial.accent)! : null;
  if (!accent) accent = parseHex(nearestCuratedTheme(bgHex).accent)!;

  // muted: given, or borrowed from the curated palette nearest this field.
  // Deliberately NOT `mix(fg, bg, …)` any more: blending the ink into the field
  // is an average, and averages trend to grey. Borrowing keeps a designer's
  // actual choice, the same way the accent above already did.
  let muted = partial.muted ? parseHex(partial.muted)! : null;
  if (!muted) muted = parseHex(nearestCuratedTheme(bgHex).muted)!;

  /**
   * Contrast handling, split by who chose the color.
   *
   * A hex an agent wrote down is an intention — a brand color, a palette pulled
   * from a reference — so we render it exactly and *say* if it falls short.
   * Silently walking it toward black meant `accent:EF5DA8` shipped as `E358A0`
   * and nobody could tell why. A value we derived carries no such intention, so
   * we still clamp those to stay legible.
   */
  const nudge = (
    role: keyof CardTheme,
    value: Rgb,
    target: number,
  ): Rgb => {
    const fixed = ensureContrast(value, bg, target);
    if (toHex(fixed) === toHex(value)) return value;
    if (partial[role]) {
      notes.push(
        note(
          "contrast_below_bar",
          "warn",
          role,
          `theme: ${role} ${toHex(value)} sits at ${contrastRatio(value, bg).toFixed(2)}:1 on this background, under the ${target}:1 bar — rendered as written`,
        ),
      );
      return value;
    }
    return fixed;
  };

  /**
   * Per-element overrides, each held to the bar its own size earns. The title
   * renders at 36px+ bold — WCAG "large text", so 3:1. The subtitle runs ~20px
   * regular and the paragraph ~14px: both under the large-text threshold, so both
   * owe the full 4.5:1.
   */
  const element = (
    role: "title" | "subtitle" | "paragraph" | "rule" | "label",
    target: number,
  ) => (partial[role] ? toHex(nudge(role, parseHex(partial[role])!, target)) : undefined);

  const overrides = {
    title: element("title", 3),
    subtitle: element("subtitle", 4.5),
    paragraph: element("paragraph", 4.5),
    // A hairline is decoration, not text — it owes no reading contrast, and
    // holding it to one would forbid the quiet dividers that actually look right.
    rule: element("rule", 0),
    label: element("label", 3),
  };

  return {
    theme: {
      bg: toHex(bg),
      fg: toHex(nudge("fg", fg, 4.5)),
      muted: toHex(nudge("muted", muted, 4.5)),
      accent: toHex(nudge("accent", accent, 3)),
      ...Object.fromEntries(
        Object.entries(overrides).filter(([, v]) => v !== undefined),
      ),
    },
    notes,
  };
}

/** The curated theme whose field is closest in luminance to `bgHex`. */
function nearestCuratedTheme(bgHex: string): CardTheme {
  const target = luminance(parseHex(bgHex)!);
  let best = CARD_THEMES[0];
  let bestDelta = Infinity;
  for (const theme of CARD_THEMES) {
    const delta = Math.abs(luminance(parseHex(theme.bg)!) - target);
    if (delta < bestDelta) {
      best = theme;
      bestDelta = delta;
    }
  }
  return best;
}
