import type { FontFamily } from "./types";

/**
 * Constructs Google Fonts css2 API URLs from catalog metadata.
 *
 * The css2 axis-tuple grammar is fiddly and easy to get subtly wrong, so all of
 * its rules live here behind a small tested surface:
 *
 *   - Axis tags are sorted alphabetically with lowercase (registered) tags
 *     before uppercase (custom) tags:  `ital,opsz,wght` then `SOFT,WONK`.
 *   - Each value tuple lists one value per tag, in the exact tag order.
 *   - Variable axes use ranges (`min..max`); the `ital` dimension is always
 *     discrete (`0` / `1`) and expands into separate tuples.
 *   - Static fonts request discrete `wght` values; italics expand into `ital`
 *     tuples the same way.
 *   - Spaces in a family name become `+`.
 *
 * The model never builds these strings itself — `lib/generate.ts` injects the
 * output of `pairingCss2Url` straight into the agent prompt.
 */

const CSS2_BASE = "https://fonts.googleapis.com/css2";

export type DisplayParam = "auto" | "block" | "swap" | "fallback" | "optional";

export interface FamilyUrlOptions {
  /** Discrete weights to request (static fonts / previews). */
  weights?: number[];
  /** Whether to include italic styles. */
  italics?: boolean;
  /** Restrict to specific glyphs (the css2 `text=` optimization). */
  text?: string;
}

function plusName(family: string): string {
  return family.trim().replace(/\s+/g, "+");
}

/** Lowercase (registered) tags first, then uppercase (custom) tags; alpha within each group. */
export function sortAxisTags(tags: string[]): string[] {
  const isLower = (t: string) => t === t.toLowerCase();
  return [...tags].sort((a, b) => {
    const al = isLower(a);
    const bl = isLower(b);
    if (al !== bl) return al ? -1 : 1;
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

interface ParsedVariants {
  uprightWeights: number[];
  italicWeights: number[];
}

/** Turn Google's `variants` list ("regular", "italic", "700", "300italic") into weight sets. */
export function parseVariants(variants: string[]): ParsedVariants {
  const upright = new Set<number>();
  const italic = new Set<number>();
  for (const v of variants) {
    if (v === "regular") {
      upright.add(400);
      continue;
    }
    if (v === "italic") {
      italic.add(400);
      continue;
    }
    const m = /^(\d+)(italic)?$/.exec(v);
    if (m) {
      const w = parseInt(m[1], 10);
      if (m[2]) italic.add(w);
      else upright.add(w);
    }
  }
  return {
    uprightWeights: [...upright].sort((a, b) => a - b),
    italicWeights: [...italic].sort((a, b) => a - b),
  };
}

function hasItalic(family: FontFamily): boolean {
  return (
    family.variants.some((v) => v.includes("italic")) ||
    (family.axes?.some((a) => a.tag === "ital") ?? false)
  );
}

/** Range axes are the variable axes excluding `ital`, which is handled discretely. */
function rangeAxes(family: FontFamily) {
  return (family.axes ?? []).filter((a) => a.tag !== "ital");
}

function pickWeight(parsed: ParsedVariants): number {
  const all = parsed.uprightWeights.length
    ? parsed.uprightWeights
    : parsed.italicWeights;
  if (!all.length) return 400;
  if (all.includes(400)) return 400;
  // nearest to 400
  return all.reduce((best, w) =>
    Math.abs(w - 400) < Math.abs(best - 400) ? w : best,
  );
}

/**
 * Build the value of a single css2 `family=` parameter for one family:
 * everything after `family=`, e.g. `Fraunces:ital,opsz,wght@0,9..144,100..900;1,...`.
 */
export function familyParam(
  family: FontFamily,
  opts: FamilyUrlOptions = {},
): string {
  const name = plusName(family.family);
  const wantItalic = opts.italics ?? false;
  const italicAvailable = hasItalic(family);
  const useItalic = wantItalic && italicAvailable;

  const axes = rangeAxes(family);
  const isVariable = axes.length > 0;

  if (isVariable) {
    const tags = sortAxisTags([...(useItalic ? ["ital"] : []), ...axes.map((a) => a.tag)]);
    const rangeFor = new Map(
      axes.map((a) => [a.tag, `${a.min}..${a.max}`] as const),
    );
    const italValues = useItalic ? [0, 1] : [0];
    const tuples = italValues.map((iv) =>
      tags.map((t) => (t === "ital" ? String(iv) : rangeFor.get(t)!)).join(","),
    );
    // A single-axis upright-only request collapses to `Name:wght@min..max`.
    return `${name}:${tags.join(",")}@${tuples.join(";")}`;
  }

  // Static font: discrete weights.
  const parsed = parseVariants(family.variants);
  const weights =
    opts.weights && opts.weights.length
      ? [...opts.weights].sort((a, b) => a - b)
      : parsed.uprightWeights.length
        ? parsed.uprightWeights
        : [pickWeight(parsed)];

  if (useItalic) {
    const tuples: string[] = [];
    for (const w of weights) tuples.push(`0,${w}`);
    for (const w of weights) tuples.push(`1,${w}`);
    return `${name}:ital,wght@${tuples.join(";")}`;
  }

  return `${name}:wght@${weights.join(";")}`;
}

function buildUrl(params: string[], opts: FamilyUrlOptions): string {
  const parts = params.map((p) => `family=${p}`);
  if (opts.text) parts.push(`text=${encodeURIComponent(opts.text)}`);
  parts.push(`display=swap`);
  return `${CSS2_BASE}?${parts.join("&")}`;
}

/** A lightweight URL for browse-grid / preview rendering (one weight, no italics by default). */
export function familyPreviewUrl(
  family: FontFamily,
  opts: FamilyUrlOptions = {},
): string {
  const previewOpts: FamilyUrlOptions = {
    weights: opts.weights ?? [pickWeight(parseVariants(family.variants))],
    italics: opts.italics ?? false,
    text: opts.text,
  };
  return buildUrl([familyParam(family, previewOpts)], previewOpts);
}

/** The full-range URL for a family: all axes / all weights, italics included. */
export function familyFullUrl(family: FontFamily): string {
  const opts: FamilyUrlOptions = { italics: true };
  return buildUrl([familyParam(family, opts)], opts);
}

/** One css2 URL covering both faces of a pairing at full range — injected into the agent prompt. */
export function pairingCss2Url(display: FontFamily, text: FontFamily): string {
  const opts: FamilyUrlOptions = { italics: true };
  return buildUrl(
    [familyParam(display, opts), familyParam(text, opts)],
    opts,
  );
}
