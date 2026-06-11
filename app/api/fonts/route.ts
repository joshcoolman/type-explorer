import { NextRequest, NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";
import type { FontFamily } from "@/lib/types";

export const runtime = "nodejs";

type SortKey = "popularity" | "trending" | "date" | "alpha";

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
  const q = (sp.get("q") ?? "").trim().toLowerCase();
  const category = sp.get("category") ?? "";
  const sort = (sp.get("sort") ?? "popularity") as SortKey;
  const limit = Math.min(Number(sp.get("limit") ?? 60) || 60, 500);
  const offset = Math.max(Number(sp.get("offset") ?? 0) || 0, 0);

  let families = catalog.families;
  if (q) families = families.filter((f) => f.family.toLowerCase().includes(q));
  if (category && category !== "all") {
    families = families.filter((f) => f.category === category);
  }
  families = sortFamilies(families, sort);

  const total = families.length;
  const page = families.slice(offset, offset + limit);

  return NextResponse.json({
    fetchedAt: catalog.fetchedAt,
    total,
    offset,
    limit,
    families: page,
  });
}
