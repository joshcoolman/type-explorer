import { describe, it, expect } from "vitest";
import {
  sortAxisTags,
  parseVariants,
  familyParam,
  familyPreviewUrl,
  pairingCss2Url,
} from "./css2-url";
import type { FontFamily } from "./types";

const fraunces: FontFamily = {
  family: "Fraunces",
  category: "serif",
  variants: ["regular", "italic"],
  axes: [
    { tag: "opsz", min: 9, max: 144, defaultValue: 14 },
    { tag: "wght", min: 100, max: 900, defaultValue: 400 },
    { tag: "SOFT", min: 0, max: 100, defaultValue: 0 },
    { tag: "WONK", min: 0, max: 1, defaultValue: 0 },
  ],
  subsets: ["latin"],
  popularityRank: 50,
  lastModified: "2024-01-01",
};

const libreFranklin: FontFamily = {
  family: "Libre Franklin",
  category: "sans-serif",
  variants: ["100", "300", "400", "400italic", "700", "700italic"],
  subsets: ["latin"],
  popularityRank: 80,
  lastModified: "2024-01-01",
};

describe("sortAxisTags", () => {
  it("puts lowercase tags before uppercase, alpha within each group", () => {
    expect(sortAxisTags(["WONK", "wght", "SOFT", "opsz", "ital"])).toEqual([
      "ital",
      "opsz",
      "wght",
      "SOFT",
      "WONK",
    ]);
  });
});

describe("parseVariants", () => {
  it("separates upright and italic weights, mapping regular/italic to 400", () => {
    expect(parseVariants(["100", "regular", "italic", "700italic"])).toEqual({
      uprightWeights: [100, 400],
      italicWeights: [400, 700],
    });
  });
});

describe("familyParam (variable font)", () => {
  it("orders axes correctly and uses ranges, with ital expanding into two tuples", () => {
    expect(familyParam(fraunces, { italics: true })).toBe(
      "Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,100..900,0..100,0..1;1,9..144,100..900,0..100,0..1",
    );
  });

  it("omits the ital dimension entirely when italics are not requested", () => {
    expect(familyParam(fraunces, { italics: false })).toBe(
      "Fraunces:opsz,wght,SOFT,WONK@9..144,100..900,0..100,0..1",
    );
  });
});

describe("familyParam (static font)", () => {
  it("requests discrete upright weights by default", () => {
    expect(familyParam(libreFranklin)).toBe("Libre+Franklin:wght@100;300;400;700");
  });

  it("expands ital,wght tuples for italics", () => {
    expect(familyParam(libreFranklin, { italics: true })).toBe(
      "Libre+Franklin:ital,wght@0,100;0,300;0,400;0,700;1,100;1,300;1,400;1,700",
    );
  });

  it("honors an explicit single-weight preview request", () => {
    expect(familyParam(libreFranklin, { weights: [400] })).toBe(
      "Libre+Franklin:wght@400",
    );
  });
});

describe("familyPreviewUrl", () => {
  it("requests a single 400 weight with display=swap", () => {
    expect(familyPreviewUrl(libreFranklin)).toBe(
      "https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400&display=swap",
    );
  });

  it("supports text= subsetting", () => {
    expect(familyPreviewUrl(libreFranklin, { text: "Aa" })).toBe(
      "https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400&text=Aa&display=swap",
    );
  });
});

describe("pairingCss2Url", () => {
  it("joins two families into one URL at full range", () => {
    expect(pairingCss2Url(fraunces, libreFranklin)).toBe(
      "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,100..900,0..100,0..1;1,9..144,100..900,0..100,0..1&family=Libre+Franklin:ital,wght@0,100;0,300;0,400;0,700;1,100;1,300;1,400;1,700&display=swap",
    );
  });
});
