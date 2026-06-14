import { describe, it, expect } from "vitest";
import {
  hexToHsl,
  paletteToParam,
  deriveTokens,
  derivePaletteCss,
  readPaletteState,
  DEFAULT_PALETTE,
  PALETTE_TOKENS,
} from "./palette";

describe("hexToHsl", () => {
  it("parses pure colors", () => {
    expect(hexToHsl("#ffffff")).toEqual({ h: 0, s: 0, l: 100 });
    expect(hexToHsl("#000000")).toEqual({ h: 0, s: 0, l: 0 });
    const red = hexToHsl("#ff0000");
    expect(red.h).toBe(0);
    expect(Math.round(red.s)).toBe(100);
    expect(Math.round(red.l)).toBe(50);
  });

  it("expands 3-digit hex and tolerates a missing #", () => {
    expect(hexToHsl("fff")).toEqual({ h: 0, s: 0, l: 100 });
    expect(hexToHsl("#f00").h).toBe(0);
  });

  it("falls back to mid-grey on garbage", () => {
    expect(hexToHsl("nope")).toEqual({ h: 0, s: 0, l: 50 });
  });
});

describe("paletteToParam", () => {
  it("joins the three sources, stripping the leading #", () => {
    expect(
      paletteToParam({ light: "#f6f1e7", dark: "#1f1b17", accent: "#dc4a2e" }),
    ).toBe("f6f1e7-1f1b17-dc4a2e");
  });
});

describe("deriveTokens", () => {
  it("emits every token for both modes as bare HSL channels", () => {
    const { light, dark } = deriveTokens(DEFAULT_PALETTE);
    for (const key of PALETTE_TOKENS) {
      expect(light[key]).toMatch(/^\d+ \d+% \d+%$/);
      expect(dark[key]).toMatch(/^\d+ \d+% \d+%$/);
    }
  });

  it("swaps ground and figure between modes (paper bg in light, ink bg in dark)", () => {
    const { light, dark } = deriveTokens(DEFAULT_PALETTE);
    // light bg should be lighter than its foreground; dark bg should be darker.
    const lBg = Number(light.background.split(" ")[2].replace("%", ""));
    const lFg = Number(light.foreground.split(" ")[2].replace("%", ""));
    const dBg = Number(dark.background.split(" ")[2].replace("%", ""));
    const dFg = Number(dark.foreground.split(" ")[2].replace("%", ""));
    expect(lBg).toBeGreaterThan(lFg);
    expect(dBg).toBeLessThan(dFg);
  });

  it("uses the accent for signal and ring in both modes", () => {
    const { light } = deriveTokens(DEFAULT_PALETTE);
    expect(light.signal).toBe(light.ring);
  });
});

describe("derivePaletteCss", () => {
  it("produces a :root and a .dark block with all nine custom properties each", () => {
    const css = derivePaletteCss(DEFAULT_PALETTE);
    expect(css).toMatch(/^:root\{/);
    expect(css).toContain("}.dark{");
    // 9 tokens × 2 blocks = 18 declarations
    expect(css.match(/--[a-z-]+:/g)?.length).toBe(PALETTE_TOKENS.length * 2);
  });
});

describe("readPaletteState", () => {
  it("returns the default (enabled) when there is no window", () => {
    expect(readPaletteState()).toEqual({
      palette: DEFAULT_PALETTE,
      enabled: true,
    });
  });
});
