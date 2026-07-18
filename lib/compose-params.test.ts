import { describe, expect, it } from "vitest";
import { parseComposeParams, type FontResolver } from "./compose-params";
import type { FontFamily } from "./types";

/**
 * These tests cover the never-fail contract, which is the load-bearing promise of
 * `/compose`: an agent that usually cannot see its output hands a URL to a real
 * person. Malformed input must degrade to something publishable AND report itself,
 * because the note is the only channel the agent has for self-correction.
 */

const gloock: FontFamily = {
  family: "Gloock",
  category: "serif",
  variants: ["regular"],
  subsets: ["latin"],
  popularityRank: 100,
  lastModified: "2024-01-01",
};

const inter: FontFamily = {
  family: "Inter",
  category: "sans-serif",
  variants: ["regular", "700"],
  axes: [{ tag: "wght", min: 100, max: 900, defaultValue: 400 }],
  subsets: ["latin"],
  popularityRank: 1,
  lastModified: "2024-01-01",
};

const FONTS: Record<string, FontFamily> = { gloock: gloock, inter };
const resolve: FontResolver = (slug) => FONTS[slug] ?? null;

const parse = (query: string) =>
  parseComposeParams(new URLSearchParams(query), resolve);

describe("pairs", () => {
  it("accepts both `+` and the space it decodes to", () => {
    // `pairs=gloock+inter` arrives at the server as "gloock inter".
    expect(parse("pairs=gloock inter").pairs).toHaveLength(1);
    expect(parse("pairs=gloock+inter").pairs).toHaveLength(1);
  });

  it("treats a lone slug as a valid one-font card, not an error", () => {
    const spec = parse("pairs=gloock");
    expect(spec.pairs[0].monovoice).toBe(true);
    expect(spec.pairs[0].text.family).toBe("Gloock");
    expect(spec.notes).toHaveLength(0);
  });

  it("drops an unknown display font and says so, keeping the good cards", () => {
    const spec = parse("pairs=nonesuch+inter,gloock+inter");
    expect(spec.pairs).toHaveLength(1);
    expect(spec.pairs[0].display.family).toBe("Gloock");
    expect(spec.notes.join(" ")).toContain("nonesuch");
  });

  it("falls back to monovoice when only the text font is unknown", () => {
    const spec = parse("pairs=gloock+nonesuch");
    expect(spec.pairs[0].text.family).toBe("Gloock");
    expect(spec.notes.join(" ")).toMatch(/nonesuch/);
  });

  it("caps at four pairs and reports the overflow", () => {
    const spec = parse("pairs=" + Array(6).fill("gloock+inter").join(","));
    expect(spec.pairs).toHaveLength(4);
    expect(spec.notes.join(" ")).toContain("maximum");
  });
});

describe("never fails", () => {
  it("returns a usable spec for pure garbage", () => {
    const spec = parse("pairs=@@@&theme=!!!&scale=banana&h1=-999&mood=purple");
    expect(spec.pairs).toHaveLength(0); // the page supplies a default direction
    expect(spec.themes.length).toBeGreaterThan(0);
    expect(spec.sizes.h1).toBeGreaterThan(0);
    expect(spec.notes.length).toBeGreaterThan(0);
  });

  it("clamps out-of-range overrides rather than honoring or rejecting them", () => {
    const spec = parse("pairs=gloock+inter&h1=800");
    expect(spec.sizes.h1).toBe(120);
    expect(spec.notes.join(" ")).toContain("clamped");
  });

  it("reports unknown params so a typo'd key is visible", () => {
    const spec = parse("pairs=gloock+inter&colour=red");
    expect(spec.ignored).toEqual(["colour"]);
    expect(spec.notes.join(" ")).toContain("colour");
  });
});

describe("free text", () => {
  it("strips URLs — our domain must not lend credibility to someone else's link", () => {
    const spec = parse("pairs=gloock+inter&title=Visit https://evil.example now");
    expect(spec.voice.title).not.toContain("evil");
    expect(spec.notes.join(" ")).toContain("URL");
  });

  it("truncates over-long text instead of erroring", () => {
    const spec = parse(`pairs=gloock+inter&title=${"a".repeat(400)}`);
    expect(spec.voice.title.length).toBeLessThanOrEqual(120);
    expect(spec.notes.join(" ")).toContain("truncated");
  });
});

describe("theme", () => {
  it("derives the roles you omit from a bring-your-own background", () => {
    const spec = parse("pairs=gloock+inter&theme=bg:212121,accent:E34712");
    const theme = spec.themes[0];
    expect(theme.bg).toBe("#212121");
    expect(theme.fg).toMatch(/^#[0-9a-f]{6}$/);
    expect(theme.muted).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("nudges a supplied role that would be illegible, and says so", () => {
    // #222 muted on a #212121 field is invisible; it must come back legible.
    const spec = parse("pairs=gloock+inter&theme=bg:212121,muted:222222");
    expect(spec.themes[0].muted).not.toBe("#222222");
    expect(spec.notes.join(" ")).toContain("muted");
  });

  it("falls back to the curated set when a custom theme has nothing usable", () => {
    const spec = parse("pairs=gloock+inter&theme=bg:zzz");
    expect(spec.themes[0].bg).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(spec.notes.length).toBeGreaterThan(0);
  });
});

describe("canonical form", () => {
  it("is stable across equivalent URLs, so they share a CDN cache entry", () => {
    const a = parse("pairs=gloock+inter&scale=4&mood=warm");
    const b = parse("mood=warm&scale=4&pairs=gloock inter");
    expect(a.canonical).toBe(b.canonical);
  });

  it("omits defaulted dials", () => {
    expect(parse("pairs=gloock+inter&scale=3").canonical).toBe("pairs=gloock%2Binter");
  });
});
