import { promises as fs } from "fs";
import path from "path";
import type { Catalog, FontAxis, FontCategory, FontFamily } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const CATALOG_FILE = path.join(DATA_DIR, "fonts.json");
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const WEBFONTS_ENDPOINT = "https://www.googleapis.com/webfonts/v1/webfonts";

const VALID_CATEGORIES: FontCategory[] = [
  "serif",
  "sans-serif",
  "display",
  "monospace",
  "handwriting",
];

interface WebfontItem {
  family: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  category: string;
  axes?: { tag: string; start: number; end: number }[];
}

interface WebfontResponse {
  items?: WebfontItem[];
}

// In-process cache so repeated requests within one server lifetime skip disk I/O.
const g = globalThis as unknown as { __typeExplorerCatalog?: Catalog };

function normalizeCategory(raw: string): FontCategory {
  const c = raw.toLowerCase().replace(/\s+/g, "-");
  return (VALID_CATEGORIES as string[]).includes(c)
    ? (c as FontCategory)
    : "sans-serif";
}

function axisDefault(tag: string, min: number, max: number): number {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  if (tag === "wght") return clamp(400);
  if (tag === "opsz") return clamp(14);
  return min;
}

function toAxes(item: WebfontItem): FontAxis[] | undefined {
  if (!item.axes || item.axes.length === 0) return undefined;
  return item.axes.map((a) => ({
    tag: a.tag,
    min: a.start,
    max: a.end,
    defaultValue: axisDefault(a.tag, a.start, a.end),
  }));
}

async function fetchSorted(
  sort: string,
  capabilities: string[] = [],
): Promise<WebfontItem[]> {
  const key = process.env.GOOGLE_FONTS_API_KEY;
  if (!key) {
    throw new Error(
      "GOOGLE_FONTS_API_KEY is not set. Copy .env.example to .env.local and add a key.",
    );
  }
  const params = new URLSearchParams({ key, sort });
  // `capability` is a repeated enum param — one entry each, never comma-joined.
  for (const c of capabilities) params.append("capability", c);
  const res = await fetch(`${WEBFONTS_ENDPOINT}?${params.toString()}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Google Webfonts API request failed (${res.status}). ${body.slice(0, 300)}`,
    );
  }
  const data = (await res.json()) as WebfontResponse;
  return data.items ?? [];
}

/** Fetch the full catalog from Google, merging variable-axis metadata and trending ranks. */
async function fetchCatalog(): Promise<Catalog> {
  // One call carries the families + axes in popularity order; a second supplies trending ranks.
  const [base, trending] = await Promise.all([
    fetchSorted("popularity", ["WOFF2", "VF"]),
    fetchSorted("trending").catch(() => [] as WebfontItem[]),
  ]);

  const trendingRankByFamily = new Map<string, number>();
  trending.forEach((item, i) => trendingRankByFamily.set(item.family, i));

  const families: FontFamily[] = base.map((item, i) => ({
    family: item.family,
    category: normalizeCategory(item.category),
    variants: item.variants,
    axes: toAxes(item),
    subsets: item.subsets,
    popularityRank: i,
    trendingRank: trendingRankByFamily.get(item.family),
    lastModified: item.lastModified,
  }));

  return { fetchedAt: new Date().toISOString(), families };
}

async function readFromDisk(): Promise<Catalog | undefined> {
  try {
    const raw = await fs.readFile(CATALOG_FILE, "utf8");
    const parsed = JSON.parse(raw) as Catalog;
    if (Array.isArray(parsed.families) && typeof parsed.fetchedAt === "string") {
      return parsed;
    }
  } catch {
    /* missing or corrupt — treat as no cache */
  }
  return undefined;
}

async function writeToDisk(catalog: Catalog): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(CATALOG_FILE, JSON.stringify(catalog, null, 2), "utf8");
}

function isStale(catalog: Catalog): boolean {
  const age = Date.now() - new Date(catalog.fetchedAt).getTime();
  return Number.isNaN(age) || age > TTL_MS;
}

/**
 * Return the cached catalog, fetching from Google only on a cache miss, when the
 * cache is older than the TTL, or when `force` is set (the manual refresh action).
 */
export async function getCatalog(force = false): Promise<Catalog> {
  if (!force && g.__typeExplorerCatalog && !isStale(g.__typeExplorerCatalog)) {
    return g.__typeExplorerCatalog;
  }

  if (!force) {
    const disk = await readFromDisk();
    if (disk && !isStale(disk)) {
      g.__typeExplorerCatalog = disk;
      return disk;
    }
  }

  const fresh = await fetchCatalog();
  await writeToDisk(fresh);
  g.__typeExplorerCatalog = fresh;
  return fresh;
}

/** Look up one family by exact (or normalized) name — used to validate proposals. */
export async function findFamily(name: string): Promise<FontFamily | undefined> {
  const catalog = await getCatalog();
  const target = name.trim().toLowerCase();
  return catalog.families.find((f) => f.family.toLowerCase() === target);
}
