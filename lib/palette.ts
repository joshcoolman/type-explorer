"use client";

/**
 * The user-controlled specimen palette: three source colors (a light "paper", a
 * dark "ink", and an accent "signal"). Every other token a specimen needs —
 * card, muted, muted-foreground, border, signal-foreground, ring — is DERIVED
 * from those three, so the user only ever picks three swatches.
 *
 * The derivation here is the canonical reference. The exact same formula is
 * mirrored, in vanilla JS, inside `.claude/skills/type-specimen/template.html`
 * (the `applyPalette` helper) so a standalone/downloaded specimen self-derives
 * without this module. Keep the two in sync — if you change a coefficient here,
 * change it there too.
 *
 * Tokens are emitted as bare HSL channels (`"H S% L%"`) to match the specimen's
 * existing `hsl(var(--token))` convention.
 */

import type { Palette } from "./types";
export type { Palette };

export interface PaletteState {
  palette: Palette;
  enabled: boolean;
}

/** The template's stock warm-editorial palette, expressed as the three sources. */
export const DEFAULT_PALETTE: Palette = {
  light: "#f6f1e7", // hsl(42 38% 97%)-ish paper
  dark: "#1f1b17", // near-black ink
  accent: "#dc4a2e", // vermilion signal
};

const KEY = "type-explorer:palette";

// ----- localStorage CRUD (SSR-safe, best-effort) -----

export function readPaletteState(): PaletteState {
  const fallback: PaletteState = { palette: DEFAULT_PALETTE, enabled: true };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PaletteState>;
    const p = parsed.palette;
    if (
      !p ||
      typeof p.light !== "string" ||
      typeof p.dark !== "string" ||
      typeof p.accent !== "string"
    ) {
      return fallback;
    }
    return { palette: p as Palette, enabled: parsed.enabled !== false };
  } catch {
    return fallback;
  }
}

export function writePaletteState(state: PaletteState): PaletteState {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* quota or disabled storage — keep working in-memory for this session */
    }
  }
  return state;
}

// ----- the iframe src param: `RRGGBB-RRGGBB-RRGGBB` (light-dark-accent) -----

export function paletteToParam(p: Palette): string {
  return [p.light, p.dark, p.accent].map((c) => c.replace(/^#/, "")).join("-");
}

// ----- colour math + token derivation (the canonical formula) -----

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

/** Parse `#rgb`/`#rrggbb` into HSL. Unknown input falls back to mid-grey. */
export function hexToHsl(hex: string): Hsl {
  let h = hex.replace(/^#/, "").trim();
  if (h.length === 3) h = h.replace(/(.)/g, "$1$1");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return { h: 0, s: 0, l: 50 };
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let hue = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hue = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue /= 6;
  }
  return { h: hue * 360, s: s * 100, l: l * 100 };
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/** Shift an HSL colour by deltas / saturation scale; returns the `"H S% L%"` string. */
function shift(c: Hsl, dl: number, satScale = 1, satCap = 100): string {
  const s = clamp(Math.min(c.s * satScale, satCap));
  const l = clamp(c.l + dl);
  return `${Math.round(c.h)} ${Math.round(s)}% ${Math.round(l)}%`;
}

/** Blend `from` toward `to` by `t` (0..1) on lightness, desaturating toward `to`. */
function towards(from: Hsl, to: Hsl, t: number, satCap = 12): string {
  const l = clamp(from.l + (to.l - from.l) * t);
  const s = clamp(Math.min(from.s, satCap));
  return `${Math.round(from.h)} ${Math.round(s)}% ${Math.round(l)}%`;
}

export const PALETTE_TOKENS = [
  "background",
  "foreground",
  "card",
  "muted",
  "muted-foreground",
  "border",
  "signal",
  "signal-foreground",
  "ring",
] as const;

export type PaletteTokens = Record<(typeof PALETTE_TOKENS)[number], string>;

/** Derive the full light + dark token sets from the three source colours. */
export function deriveTokens(p: Palette): { light: PaletteTokens; dark: PaletteTokens } {
  const light = hexToHsl(p.light);
  const dark = hexToHsl(p.dark);
  const accent = hexToHsl(p.accent);
  const accentStr = `${Math.round(accent.h)} ${Math.round(accent.s)}% ${Math.round(accent.l)}%`;
  const accentDark = shift(accent, 8, 1, 100); // a touch brighter on dark grounds

  return {
    light: {
      background: shift(light, 0),
      foreground: shift(dark, 0),
      card: shift(light, 2),
      muted: shift(light, -5, 0.6),
      "muted-foreground": towards(dark, light, 0.45),
      border: shift(light, -13, 0.8),
      signal: accentStr,
      "signal-foreground": shift(light, 0),
      ring: accentStr,
    },
    dark: {
      background: shift(dark, 0),
      foreground: shift(light, 0),
      card: shift(dark, 2),
      muted: shift(dark, 7),
      "muted-foreground": towards(light, dark, 0.4),
      border: shift(dark, 11),
      signal: accentDark,
      "signal-foreground": shift(dark, 0),
      ring: accentDark,
    },
  };
}

/** Build the `:root{…} .dark{…}` override stylesheet text. */
export function derivePaletteCss(p: Palette): string {
  const { light, dark } = deriveTokens(p);
  const block = (sel: string, t: PaletteTokens) =>
    `${sel}{${PALETTE_TOKENS.map((k) => `--${k}:${t[k]};`).join("")}}`;
  return `${block(":root", light)}${block(".dark", dark)}`;
}

/** Convenience for UI swatches: key tokens as ready `hsl(...)` colours. */
export function swatchColors(p: Palette, mode: "light" | "dark") {
  const t = deriveTokens(p)[mode];
  return {
    background: `hsl(${t.background})`,
    foreground: `hsl(${t.foreground})`,
    // `muted` is a near-background fill; `mutedForeground` is the readable
    // de-emphasised TEXT tone — use the latter for any text on `background`.
    muted: `hsl(${t.muted})`,
    mutedForeground: `hsl(${t["muted-foreground"]})`,
    signal: `hsl(${t.signal})`,
  };
}
