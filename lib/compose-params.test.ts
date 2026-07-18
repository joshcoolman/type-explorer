import { describe, expect, it } from "vitest";
import { parseComposeParams, type FontResolver } from "./compose-params";
import { messagesOf } from "./compose-notes";
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
    expect(messagesOf(spec.notes).join(" ")).toContain("nonesuch");
  });

  it("falls back to monovoice when only the text font is unknown", () => {
    const spec = parse("pairs=gloock+nonesuch");
    expect(spec.pairs[0].text.family).toBe("Gloock");
    expect(messagesOf(spec.notes).join(" ")).toMatch(/nonesuch/);
  });

  it("caps at four pairs and reports the overflow", () => {
    const spec = parse("pairs=" + Array(6).fill("gloock+inter").join(","));
    expect(spec.pairs).toHaveLength(4);
    expect(messagesOf(spec.notes).join(" ")).toContain("maximum");
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
    expect(messagesOf(spec.notes).join(" ")).toContain("clamped");
  });

  it("reports unknown params so a typo'd key is visible", () => {
    const spec = parse("pairs=gloock+inter&colour=red");
    expect(spec.ignored).toEqual(["colour"]);
    expect(messagesOf(spec.notes).join(" ")).toContain("colour");
  });
});

describe("free text", () => {
  it("strips URLs — our domain must not lend credibility to someone else's link", () => {
    const spec = parse("pairs=gloock+inter&title=Visit https://evil.example now");
    expect(spec.voice.title).not.toContain("evil");
    expect(messagesOf(spec.notes).join(" ")).toContain("URL");
  });

  it("truncates over-long text instead of erroring", () => {
    const spec = parse(`pairs=gloock+inter&title=${"a".repeat(400)}`);
    expect(spec.voice.title.length).toBeLessThanOrEqual(120);
    expect(messagesOf(spec.notes).join(" ")).toContain("truncated");
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

  it("renders a supplied role exactly, even when illegible, and says so", () => {
    // #222 muted on a #212121 field is very nearly invisible — and it still
    // renders as written. A hex an agent typed is an intention (a brand color, a
    // palette from a reference); silently walking it toward legibility meant a
    // stated color shipped as a different one with no way to tell why. The note
    // is how the contract stays honest instead.
    const spec = parse("pairs=gloock+inter&theme=bg:212121,muted:222222");
    expect(spec.themes[0].muted).toBe("#222222");
    expect(messagesOf(spec.notes).join(" ")).toContain("muted");
    expect(messagesOf(spec.notes).join(" ")).toContain("rendered as written");
  });

  it("still clamps a role it derived itself", () => {
    // Nobody stated `muted` here, so there is no intention to honor and the
    // legibility floor applies. This is the other half of the same rule.
    const spec = parse("pairs=gloock+inter&theme=bg:F5F0E8");
    const t = spec.themes[0];
    expect(t.muted).toMatch(/^#[0-9a-f]{6}$/);
    expect(t.muted).not.toBe(t.bg);
  });

  it("gives the subtitle and the paragraph different colors", () => {
    // The defect this replaced: both fell back to `muted`, so they were
    // identical by construction and the accent did no work on the page.
    const spec = parse("pairs=gloock+inter&theme=bg:FFF3E0,fg:34302B,accent:EF5DA8");
    const t = spec.themes[0];
    expect(t.subtitle).not.toBe(t.paragraph);
    // The subtitle carries the accent hue rather than a neutral. It is not the
    // accent verbatim: nobody stated a subtitle, so this value is derived and
    // therefore clamped to stay readable at deck size — the accent itself, being
    // explicit, renders untouched on the label.
    expect(t.subtitle).not.toBe(t.muted);
    expect(t.accent).toBe("#ef5da8");
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(t.subtitle.slice(i, i + 2), 16));
    expect(r).toBeGreaterThan(g); // still pink, not grey
    expect(b).toBeGreaterThan(g);
  });

  it("fills every paintable slot, including the ancillary chrome", () => {
    const spec = parse("pairs=gloock+inter&theme=bg:212121");
    const t = spec.themes[0];
    for (const slot of ["title", "subtitle", "paragraph", "rule", "label"] as const) {
      expect(t[slot]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("accepts an explicit hex for the ancillary slots too", () => {
    const spec = parse("pairs=gloock+inter&theme=bg:212121,rule:FF0000,label:00FF00");
    expect(spec.themes[0].rule).toBe("#ff0000");
    expect(spec.themes[0].label).toBe("#00ff00");
  });

  it("falls back to the curated set when a custom theme has nothing usable", () => {
    const spec = parse("pairs=gloock+inter&theme=bg:zzz");
    expect(spec.themes[0].bg).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(spec.notes.length).toBeGreaterThan(0);
  });
});

describe("themes (per-card palettes)", () => {
  // Three resolvable cards to map palettes onto.
  const three = "pairs=gloock+inter,inter+gloock,gloock+inter";

  it("applies a single palette to every card", () => {
    const spec = parse(`${three}&themes=bg:1D4ED8`);
    expect(spec.themes).toHaveLength(3);
    expect(new Set(spec.themes.map((t) => t.bg)).size).toBe(1);
    expect(spec.themes[0].bg).toBe("#1d4ed8");
  });

  it("maps palettes to cards by index", () => {
    const spec = parse(`${three}&themes=bg:1D4ED8;bg:DC2626;bg:2563EB`);
    expect(spec.themes[0].bg).toBe("#1d4ed8");
    expect(spec.themes[1].bg).toBe("#dc2626");
    expect(spec.themes[2].bg).toBe("#2563eb");
  });

  it("cycles when fewer palettes than cards are given", () => {
    const spec = parse(`${three}&themes=bg:1D4ED8;bg:DC2626`);
    expect(spec.themes[2].bg).toBe("#1d4ed8"); // wraps back to the first
  });

  it("derives the roles each palette omits", () => {
    const spec = parse(`${three}&themes=bg:1D4ED8;bg:DC2626`);
    for (const t of spec.themes) {
      expect(t.fg).toMatch(/^#[0-9a-f]{6}$/);
      expect(t.muted).toMatch(/^#[0-9a-f]{6}$/);
      expect(t.accent).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("falls back to a curated palette for an unusable item, and says so", () => {
    const spec = parse(`${three}&themes=bg:1D4ED8;bg:zzz`);
    expect(spec.themes[1].bg).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(messagesOf(spec.notes).join(" ")).toContain("themes");
  });

  it("takes precedence over a simultaneously-given theme, with a note", () => {
    const spec = parse(`${three}&theme=bg:000000&themes=bg:1D4ED8`);
    expect(spec.themes[0].bg).toBe("#1d4ed8");
    expect(messagesOf(spec.notes).join(" ")).toContain("themes and theme");
  });

  it("serializes to a stable canonical form across equivalent URLs", () => {
    const a = parse("pairs=gloock+inter&themes=bg:1D4ED8;bg:DC2626&scale=3");
    const b = parse("themes=bg:1D4ED8;bg:DC2626&pairs=gloock inter");
    expect(a.canonical).toBe(b.canonical);
    expect(a.canonical).toContain("themes=");
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
