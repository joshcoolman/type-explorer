/**
 * The implementation handoff: turning "that one" into working code with no
 * re-derivation.
 *
 * A composed page is only half the deliverable. The other half is what the user's
 * agent needs to actually ship the choice — the css2 URL, the Tailwind tokens, the
 * CSS custom properties, the exact weights and axis ranges, and the fallback
 * stacks. All of it is derived from the same catalog metadata that drove the
 * render, so the page and the snippets can't disagree.
 *
 * URL strings are never hand-rolled here — `lib/css2-url.ts` owns that grammar.
 */

import type { CardTheme } from "./card-themes";
import type { ComposePair } from "./compose-params";
import { familyParam, parseVariants, pairingCss2Url, familyFullUrl } from "./css2-url";
import { fontStack } from "./font-stack";
import { slugify } from "./slug";
import type { FontFamily } from "./types";

export interface FontSpec {
  family: string;
  slug: string;
  category: string;
  /** CSS `font-family` value including fallbacks. */
  stack: string;
  /** Discrete weights the family ships (static fonts). */
  weights: number[];
  /** Variable axes as `wght 100..900` strings, empty for static families. */
  axes: string[];
  italic: boolean;
}

export interface CardHandoff {
  role: "display" | "text" | "both";
  fonts: FontSpec[];
  theme: CardTheme;
  /** One css2 URL covering every face this card uses. */
  css2: string;
}

export interface Handoff {
  cards: CardHandoff[];
  /** A single css2 URL covering every font on the page. */
  css2All: string;
  importRule: string;
  linkTag: string;
  tailwind: string;
  cssVars: string;
}

function specFor(family: FontFamily): FontSpec {
  const parsed = parseVariants(family.variants);
  return {
    family: family.family,
    slug: slugify(family.family),
    category: family.category,
    stack: fontStack(family),
    weights: parsed.uprightWeights,
    axes: (family.axes ?? [])
      .filter((a) => a.tag !== "ital")
      .map((a) => `${a.tag} ${a.min}..${a.max}`),
    italic: parsed.italicWeights.length > 0 || (family.axes?.some((a) => a.tag === "ital") ?? false),
  };
}

/** A CSS custom-property-safe token from a family name: "DM Sans" -> "dm-sans". */
function tokenFor(family: FontFamily): string {
  return slugify(family.family);
}

/**
 * Build the css2 URL for a whole page. `pairingCss2Url` covers the two-font case
 * directly; beyond that we compose the same `family=` params it uses, so the axis
 * grammar still comes from one place.
 */
function css2ForFamilies(families: FontFamily[]): string {
  const unique = dedupe(families);
  if (unique.length === 1) return familyFullUrl(unique[0]);
  if (unique.length === 2) return pairingCss2Url(unique[0], unique[1]);
  const parts = unique.map((f) => `family=${familyParam(f, { italics: true })}`);
  return `https://fonts.googleapis.com/css2?${parts.join("&")}&display=swap`;
}

function dedupe(families: FontFamily[]): FontFamily[] {
  const seen = new Set<string>();
  const out: FontFamily[] = [];
  for (const f of families) {
    if (seen.has(f.family)) continue;
    seen.add(f.family);
    out.push(f);
  }
  return out;
}

export function buildHandoff(pairs: ComposePair[], themes: CardTheme[]): Handoff {
  const cards: CardHandoff[] = pairs.map((pair, i) => ({
    role: pair.monovoice ? "both" : "display",
    fonts: pair.monovoice
      ? [specFor(pair.display)]
      : [specFor(pair.display), specFor(pair.text)],
    theme: themes[i % themes.length],
    css2: css2ForFamilies(pair.monovoice ? [pair.display] : [pair.display, pair.text]),
  }));

  const allFamilies = dedupe(pairs.flatMap((p) => [p.display, p.text]));
  const css2All = allFamilies.length ? css2ForFamilies(allFamilies) : "";

  // Tailwind v4 registers fonts as theme variables in CSS, not a JS config —
  // which is what this repo uses, so that's the form we hand over.
  const tailwind = [
    "@theme {",
    ...allFamilies.map((f) => `  --font-${tokenFor(f)}: "${f.family}", ${fallbackTail(f)};`),
    ...(themes[0]
      ? [
          `  --color-card-bg: ${themes[0].bg};`,
          `  --color-card-fg: ${themes[0].fg};`,
          `  --color-card-muted: ${themes[0].muted};`,
          `  --color-card-accent: ${themes[0].accent};`,
        ]
      : []),
    "}",
  ].join("\n");

  const cssVars = [
    ":root {",
    ...allFamilies.map((f) => `  --font-${tokenFor(f)}: ${JSON.stringify(f.family)}, ${fallbackTail(f)};`),
    ...(themes[0]
      ? [
          `  --card-bg: ${themes[0].bg};`,
          `  --card-fg: ${themes[0].fg};`,
          `  --card-muted: ${themes[0].muted};`,
          `  --card-accent: ${themes[0].accent};`,
        ]
      : []),
    "}",
  ].join("\n");

  return {
    cards,
    css2All,
    importRule: css2All ? `@import url("${css2All}");` : "",
    linkTag: css2All ? `<link rel="stylesheet" href="${css2All}">` : "",
    tailwind,
    cssVars,
  };
}

/** The fallback tail of a stack, without the quoted family itself. */
function fallbackTail(family: FontFamily): string {
  const stack = fontStack(family);
  return stack.slice(stack.indexOf(",") + 1).trim();
}

export type { CardTheme };
export { tokenFor };
export const _internal = { specFor, css2ForFamilies };
