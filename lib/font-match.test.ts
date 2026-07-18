import { describe, expect, it } from "vitest";
import { matchSlug } from "./font-match";
import { slugify } from "./slug";
import type { FontFamily } from "./types";

/**
 * The contract these tests defend: an agent guessing a slug from memory should
 * land the family it meant, and should NOT land a family it didn't. The second
 * half matters as much as the first — a matcher that always finds something turns
 * "Helvetica" into a silently wrong specimen the user has no way to question.
 */

function family(name: string, popularityRank: number): FontFamily {
  return {
    family: name,
    category: "sans-serif",
    variants: ["regular"],
    subsets: ["latin"],
    popularityRank,
    lastModified: "2024-01-01",
  };
}

const FAMILIES = [
  family("Inter", 0),
  family("Source Serif 4", 10),
  family("Source Sans 3", 11),
  family("Playfair Display", 20),
  family("Playfair Display SC", 21),
  family("Comic Neue", 30),
  family("Baloo 2", 40),
  family("Noto Sans", 50),
];

const index = new Map(FAMILIES.map((f) => [slugify(f.family), f]));
const match = (slug: string) => matchSlug(slug, index)?.family ?? null;

describe("matchSlug", () => {
  it("resolves an exact slug", () => {
    expect(match("comic-neue")).toBe("Comic Neue");
    expect(match("baloo-2")).toBe("Baloo 2");
  });

  it("normalizes casing and punctuation", () => {
    expect(match("Playfair_Display")).toBe("Playfair Display");
    expect(match("  COMIC--NEUE ")).toBe("Comic Neue");
  });

  it("expands a truncated name to the most popular completion", () => {
    // The version suffix is the single most guessable thing to omit.
    expect(match("source-serif")).toBe("Source Serif 4");
    // Two candidates start with `playfair-display-`... but the bare slug is an
    // exact hit, so popularity never has to break the tie here.
    expect(match("playfair")).toBe("Playfair Display");
  });

  it("absorbs a small typo in a long slug", () => {
    expect(match("playfair-dispaly")).toBe("Playfair Display");
  });

  it("returns null rather than inventing a match", () => {
    // Not a Google font at all — nothing here is close enough to be honest.
    expect(match("helvetica")).toBeNull();
    expect(match("")).toBeNull();
  });

  it("does not let a short slug fuzz into an unrelated family", () => {
    // 3 chars from "Inter" by edit distance, but well past the ratio guard.
    expect(match("nter")).toBeNull();
    expect(match("abc")).toBeNull();
  });

  it("requires a hyphen boundary for prefix expansion", () => {
    // "not" must not reach "noto-sans" by prefix; it's also too short to fuzz.
    expect(match("not")).toBeNull();
  });
});
