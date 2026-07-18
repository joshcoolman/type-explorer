import { NextRequest, NextResponse } from "next/server";
import { checkParams } from "@/lib/api-params";
import { getCatalog } from "@/lib/catalog";
import { feelingFromSlug, feelingSlug } from "@/lib/feelings";
import type { FontFamily } from "@/lib/types";

export const runtime = "nodejs";

const KNOWN_PARAMS = [
  "q",
  "category",
  "sort",
  "limit",
  "offset",
  "tag",
  "feeling",
  "minWeight",
] as const;

type SortKey = "popularity" | "trending" | "date" | "alpha";

/**
 * Icon / symbol / emoji families render as glyph grids, not readable type, so we
 * keep them out of the browse listing. Display-only filter — the catalog and the
 * generation pipeline still see them. Revisit if we ever want a dedicated view.
 */
const ICON_FONT_RE = /\b(icons?|symbols?|emoji)\b/i;

function isIconFont(f: FontFamily): boolean {
  return ICON_FONT_RE.test(f.family);
}

/** Weight of a given feeling slug on a family (0 if untagged) — for focus sort. */
function feelingWeight(f: FontFamily, slug: string): number {
  return f.feelings?.find((t) => t.name.toLowerCase() === slug)?.weight ?? 0;
}

function sortFamilies(families: FontFamily[], sort: SortKey): FontFamily[] {
  const copy = [...families];
  switch (sort) {
    case "trending":
      return copy.sort((a, b) => {
        const ar = a.trendingRank ?? Number.MAX_SAFE_INTEGER;
        const br = b.trendingRank ?? Number.MAX_SAFE_INTEGER;
        return ar - br;
      });
    case "date":
      return copy.sort((a, b) => b.lastModified.localeCompare(a.lastModified));
    case "alpha":
      return copy.sort((a, b) => a.family.localeCompare(b.family));
    case "popularity":
    default:
      return copy.sort((a, b) => a.popularityRank - b.popularityRank);
  }
}

export async function GET(req: NextRequest) {
  let catalog;
  try {
    catalog = await getCatalog();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load catalog";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const sp = req.nextUrl.searchParams;
  const { ignored, strictError } = checkParams(sp, KNOWN_PARAMS);
  if (strictError) return strictError;

  const q = (sp.get("q") ?? "").trim().toLowerCase();
  const category = sp.get("category") ?? "";
  const sort = (sp.get("sort") ?? "popularity") as SortKey;
  const limit = Math.min(Number(sp.get("limit") ?? 60) || 60, 500);
  const offset = Math.max(Number(sp.get("offset") ?? 0) || 0, 0);
  // A `tag` is a /Expressive feeling slug ("cute"). Validate against the known 20
  // so junk params just no-op rather than returning an empty grid — a stale URL
  // shouldn't strand a human on an empty page. Agents get the truth via `ignored`.
  // `feeling` is an accepted alias: it's the word an agent reaches for first, and
  // the cold probe's misdiagnosis came from guessing exactly that name.
  const feeling = feelingFromSlug(sp.get("tag") ?? sp.get("feeling") ?? "");
  // Feelings carry a 0-100 weight; `minWeight` narrows a tag to fonts that really
  // lean that way rather than merely carrying the label.
  const minWeight = Math.max(Number(sp.get("minWeight") ?? 0) || 0, 0);

  let families = catalog.families.filter((f) => !isIconFont(f));
  if (q) families = families.filter((f) => f.family.toLowerCase().includes(q));
  if (category && category !== "all") {
    families = families.filter((f) => f.category === category);
  }
  if (feeling) {
    const slug = feelingSlug(feeling);
    families = families.filter((f) =>
      f.feelings?.some(
        (t) => feelingSlug(t.name) === slug && t.weight >= minWeight,
      ),
    );
    // A focused feeling view reads best strongest-first, not by popularity.
    families = [...families].sort(
      (a, b) => feelingWeight(b, slug) - feelingWeight(a, slug),
    );
  } else {
    families = sortFamilies(families, sort);
  }

  const total = families.length;
  const page = families.slice(offset, offset + limit);

  return NextResponse.json({
    fetchedAt: catalog.fetchedAt,
    total,
    offset,
    limit,
    /** Params we didn't recognize. Always check this — see /agent.md. */
    ignored,
    /** Echo of the filters actually applied, so a caller can confirm intent. */
    applied: {
      q: q || null,
      category: category || null,
      feeling: feeling ?? null,
      minWeight: minWeight || null,
      sort: feeling ? "feeling-weight" : sort,
    },
    families: page,
  });
}
