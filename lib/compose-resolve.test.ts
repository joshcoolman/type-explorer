import { describe, expect, it } from "vitest";
import { themeProvenance } from "./card-themes";
import { parseComposeParams, type FontResolver } from "./compose-params";
import type { FontFamily } from "./types";

/**
 * The `/compose.json` contract, tested at the model layer rather than over HTTP —
 * the route is a thin serializer over exactly this, and testing here keeps the
 * assertions fast and free of a server.
 *
 * What's defended: per-card palettes really are per-card (the `themes[0]` defect),
 * provenance distinguishes what the user chose from what we filled, and notes
 * carry stable codes a consumer can branch on.
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

const resolve: FontResolver = (slug) =>
  ({ gloock, inter }[slug as "gloock" | "inter"] ?? null);

const parse = (qs: string) => parseComposeParams(new URLSearchParams(qs), resolve);
const three = "pairs=gloock+inter,inter+gloock,gloock+inter";

describe("per-card palettes reach the handoff", () => {
  it("keeps each card's palette distinct", () => {
    const spec = parse(`${three}&themes=bg:1D4ED8;bg:DC2626;bg:2563EB`);
    expect(spec.themes.map((t) => t.bg)).toEqual(["#1d4ed8", "#dc2626", "#2563eb"]);
  });

  it("tracks stated roles per card, parallel to themes", () => {
    const spec = parse(`${three}&themes=bg:1D4ED8,accent:FACC15;bg:DC2626;bg:2563EB`);
    expect(spec.statedRoles[0].sort()).toEqual(["accent", "bg"]);
    expect(spec.statedRoles[1]).toEqual(["bg"]);
  });

  it("reports nothing stated for a curated palette", () => {
    const spec = parse("pairs=gloock+inter&theme=3");
    expect(spec.statedRoles[0]).toEqual([]);
  });
});

describe("color provenance", () => {
  it("marks what the user wrote as stated and renders it untouched", () => {
    const spec = parse("pairs=gloock+inter&theme=bg:FFF3E0,fg:34302B,accent:EF5DA8");
    const p = themeProvenance(spec.themes[0], spec.statedRoles[0]);

    expect(p.bg).toEqual({ hex: "#fff3e0", source: "stated" });
    expect(p.accent).toEqual({ hex: "#ef5da8", source: "stated" });
  });

  it("names the origin role for inherited slots", () => {
    const spec = parse("pairs=gloock+inter&theme=bg:FFF3E0,fg:34302B,accent:EF5DA8");
    const p = themeProvenance(spec.themes[0], spec.statedRoles[0]);

    expect(p.title.source).toBe("from:fg");
    expect(p.subtitle.source).toBe("from:accent");
    expect(p.paragraph.source).toBe("from:muted");
  });

  it("does not claim the inherited hex equals its origin", () => {
    // The whole point of the `source`/`hex` split: subtitle comes FROM accent but
    // is darkened, because derived values are clamped and stated ones are not.
    const spec = parse("pairs=gloock+inter&theme=bg:FFF3E0,fg:34302B,accent:EF5DA8");
    const p = themeProvenance(spec.themes[0], spec.statedRoles[0]);

    expect(p.subtitle.source).toBe("from:accent");
    expect(p.subtitle.hex).not.toBe(p.accent.hex);
  });

  it("marks a fully-specified palette as stated across the board", () => {
    const spec = parse(
      "pairs=gloock+inter&theme=bg:2E3A24,fg:F2E9D8,muted:CFC6B0,title:EFD9A0," +
        "subtitle:E0A83B,paragraph:CFC6B0,accent:E0A83B,rule:5A6B44,label:B8C39A",
    );
    const p = themeProvenance(spec.themes[0], spec.statedRoles[0]);
    for (const role of Object.keys(p)) {
      expect(p[role as keyof typeof p].source).toBe("stated");
    }
  });
});

describe("card identity survives a drop", () => {
  it("keeps requestedIndex pointing at the position the agent asked for", () => {
    // Middle card drops: the survivor renders second but was asked for third.
    // Without requestedIndex, a user's "the third one" silently means the wrong card.
    const spec = parse("pairs=gloock+inter,nope-nothing+inter,inter+gloock");
    expect(spec.pairs).toHaveLength(2);
    expect(spec.pairs.map((p) => p.requestedIndex)).toEqual([0, 2]);
  });
});

describe("note codes", () => {
  const codes = (qs: string) => parse(qs).notes.map((n) => n.code);

  it("codes a dropped card", () => {
    expect(codes("pairs=nope-nothing-here+inter")).toContain("card_dropped");
  });

  it("codes an ignored param", () => {
    expect(codes("pairs=gloock+inter&bogus=1")).toContain("param_ignored");
  });

  it("codes a stated color that sits below its contrast bar", () => {
    expect(codes("pairs=gloock+inter&theme=bg:212121,muted:222222")).toContain(
      "contrast_below_bar",
    );
  });

  it("codes truncated copy", () => {
    expect(codes(`pairs=gloock+inter&title=${"x".repeat(200)}`)).toContain(
      "text_truncated",
    );
  });

  it("carries a target and severity on every note", () => {
    const spec = parse("pairs=gloock+inter&bogus=1&scale=99");
    expect(spec.notes.length).toBeGreaterThan(0);
    for (const n of spec.notes) {
      expect(n.target).toBeTruthy();
      expect(["info", "warn"]).toContain(n.severity);
    }
  });

  it("leaves a clean parse with no notes at all", () => {
    expect(parse("pairs=gloock+inter&theme=3").notes).toEqual([]);
  });
});
