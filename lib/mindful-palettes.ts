import type { Palette } from "./types";

/**
 * Mindful Palettes № 110 — the project's basic color palette (from the
 * reference in `ideas/mindful-palette.jpg`). Each named ramp is a 50→950 tonal
 * scale; the lightest steps are paper grounds, the darkest are ink, and the
 * vivid mids are signals/accents.
 *
 * These are the single source of truth for color. `BASIC_PALETTE` is the
 * default three-source palette (paper / ink / accent) fed to `lib/palette.ts`
 * `deriveTokens`; the full ramps are kept here for future use (a palette
 * picker, direct tonal steps, data-viz, etc.).
 */

export type Ramp = Record<
  "50" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900" | "950",
  string
>;

export const RAMPS: Record<string, Ramp> = {
  oriolesOrange: {
    "50": "#FFF6F4", "100": "#FEE0D5", "200": "#FDB59C", "300": "#FC906B",
    "400": "#FB6632", "500": "#E34712", "600": "#BC3B0F", "700": "#952F0C",
    "800": "#702309", "900": "#4C1806", "950": "#2C0E03",
  },
  victorianPeacock: {
    "50": "#F8FAFA", "100": "#DEE6EA", "200": "#B7C9D1", "300": "#98B1BC",
    "400": "#799AA9", "500": "#5C8396", "600": "#3F6E83", "700": "#225870",
    "800": "#0E4159", "900": "#0A2D3D", "950": "#061923",
  },
  aquaverde: {
    "50": "#F6F9F9", "100": "#DCE7E6", "200": "#B2CAC8", "300": "#98B2B0",
    "400": "#819A98", "500": "#6E8280", "600": "#5B6B6A", "700": "#485453",
    "800": "#353F3E", "900": "#242A2A", "950": "#141717",
  },
  writersParchment: {
    "50": "#FBF8F3", "100": "#F0E4D3", "200": "#D4C3AC", "300": "#BAAB97",
    "400": "#A19381", "500": "#887C6E", "600": "#70665B", "700": "#585148",
    "800": "#423C35", "900": "#2C2824", "950": "#181614",
  },
  neverything: {
    "50": "#F9F9F9", "100": "#E5E6E6", "200": "#C4C6C6", "300": "#ACADAE",
    "400": "#919698", "500": "#7A7E82", "600": "#64686B", "700": "#4F5255",
    "800": "#393D40", "900": "#25292C", "950": "#13171A",
  },
};

/** The default basic palette: Writer's Parchment ground + Orioles Orange signal. */
export const BASIC_PALETTE: Palette = {
  light: RAMPS.writersParchment["50"],
  dark: RAMPS.writersParchment["950"],
  accent: RAMPS.oriolesOrange["500"],
};

/** Alternate accents, ready to swap into BASIC_PALETTE if we change our mind. */
export const PALETTE_OPTIONS: Record<string, Palette> = {
  parchmentOrange: BASIC_PALETTE,
  parchmentPeacock: {
    light: RAMPS.writersParchment["50"],
    dark: RAMPS.writersParchment["950"],
    accent: RAMPS.victorianPeacock["700"],
  },
  neutralOrange: {
    light: RAMPS.neverything["50"],
    dark: RAMPS.neverything["950"],
    accent: RAMPS.oriolesOrange["500"],
  },
};
