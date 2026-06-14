import { describe, it, expect } from "vitest";
import { renderSpecimen, weightList } from "./specimen-render";
import type { FontFamily, SpecimenCopy } from "./types";

const variableDisplay: FontFamily = {
  family: "Fraunces",
  category: "serif",
  variants: ["regular", "italic"],
  axes: [
    { tag: "opsz", min: 9, max: 144, defaultValue: 14 },
    { tag: "wght", min: 100, max: 900, defaultValue: 400 },
  ],
  subsets: ["latin"],
  popularityRank: 50,
  lastModified: "2024-01-01",
};

const staticText: FontFamily = {
  family: "Libre Franklin",
  category: "sans-serif",
  variants: ["300", "regular", "700", "700italic"],
  subsets: ["latin"],
  popularityRank: 60,
  lastModified: "2024-01-01",
};

const copy: SpecimenCopy = {
  contextHeadline: "A clean line of thought",
  contextStandfirst: "Where the headline meets the read.",
  contextBody: ["First paragraph with a <tag> & ampersand.", "Second paragraph."],
  scaleWord: "Typography",
};

describe("weightList", () => {
  it("uses the wght axis steps for a variable font", () => {
    expect(weightList(variableDisplay)).toEqual([100, 200, 300, 400, 500, 600, 700, 800, 900]);
  });

  it("uses discrete upright weights for a static font", () => {
    expect(weightList(staticText)).toEqual([300, 400, 700]);
  });

  it("clamps variable steps to the real axis range", () => {
    const narrow: FontFamily = {
      ...variableDisplay,
      axes: [{ tag: "wght", min: 400, max: 700, defaultValue: 400 }],
    };
    expect(weightList(narrow)).toEqual([400, 500, 600, 700]);
  });
});

describe("renderSpecimen", () => {
  const html = renderSpecimen({ display: variableDisplay, text: staticText, copy });

  it("consumes every placeholder", () => {
    const tokens = [
      "{{DISPLAY_NAME}}",
      "{{TEXT_NAME}}",
      "{{CSS2_URL}}",
      "{{PALETTE_BAKED}}",
      "{{CONTEXT_HEADLINE}}",
      "{{CONTEXT_STANDFIRST}}",
      "{{CONTEXT_BODY}}",
      "{{SCALE_DATA}}",
      "{{SCALE_WORD}}",
    ];
    for (const token of tokens) expect(html).not.toContain(token);
  });

  it("is a self-contained document naming both faces", () => {
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("Fraunces");
    expect(html).toContain("Libre Franklin");
  });

  it("only ships the lean sections (no hero/colophon/ladder/tester/glyphs)", () => {
    expect(html).toContain('id="context"');
    expect(html).toContain('id="scale"');
    for (const gone of ['id="hero"', 'id="colophon"', 'id="ladder"', 'id="tester"', 'id="glyphs"', 'id="axes"', "<nav>"]) {
      expect(html).not.toContain(gone);
    }
    // In-context comes before the type scale.
    expect(html.indexOf('id="context"')).toBeLessThan(html.indexOf('id="scale"'));
  });

  it("injects scale data with each face's weights", () => {
    expect(html).toContain("window.__scaleData =");
    expect(html).toContain('"weights":[100,200,300,400,500,600,700,800,900]');
    expect(html).toContain('"weights":[300,400,700]');
  });

  it("escapes HTML in the copy", () => {
    expect(html).toContain("&lt;tag&gt; &amp; ampersand");
  });

  it("keeps the stylesheet well-formed (no stray </style> from substitution)", () => {
    const opens = (html.match(/<style[ >]/g) ?? []).length;
    const closes = (html.match(/<\/style>/g) ?? []).length;
    expect(opens).toBe(closes);
    const themed = renderSpecimen({
      display: variableDisplay,
      text: staticText,
      copy,
      palette: { light: "#ffffff", dark: "#111111", accent: "#cc3322" },
    });
    expect((themed.match(/id="palette-baked"/g) ?? []).length).toBe(1);
    expect((themed.match(/<style[ >]/g) ?? []).length).toBe(
      (themed.match(/<\/style>/g) ?? []).length,
    );
  });

  it("bakes the palette only when one is supplied", () => {
    expect(html).not.toContain('id="palette-baked"');
    const themed = renderSpecimen({
      display: variableDisplay,
      text: staticText,
      copy,
      palette: { light: "#ffffff", dark: "#111111", accent: "#cc3322" },
    });
    expect(themed).toContain('id="palette-baked"');
    expect(themed).toContain(":root{");
  });
});
