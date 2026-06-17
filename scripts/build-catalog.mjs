// Build the static font catalog the app reads at runtime.
//
//   node scripts/build-catalog.mjs        (or: npm run catalog:refresh)
//
// Fetches the Google Fonts catalog (families, variable-font axes, popularity and
// trending order), normalizes it, and writes data/fonts.json. The app imports that
// file statically, so hosting needs no API key and makes no network calls — this
// script is the only thing that talks to Google, and you run it locally.
//
// Needs GOOGLE_FONTS_API_KEY in .env.local. Enable the "Web Fonts Developer API"
// in a Google Cloud project, create an API key, then commit the refreshed JSON.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "data", "fonts.json");
const WEBFONTS_ENDPOINT = "https://www.googleapis.com/webfonts/v1/webfonts";

const VALID_CATEGORIES = ["serif", "sans-serif", "display", "monospace", "handwriting"];

function readApiKey() {
  const env = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
  const key = env.match(/^GOOGLE_FONTS_API_KEY=(.+)$/m)?.[1]?.trim();
  if (!key) throw new Error("GOOGLE_FONTS_API_KEY not found in .env.local");
  return key;
}

function normalizeCategory(raw) {
  const c = raw.toLowerCase().replace(/\s+/g, "-");
  return VALID_CATEGORIES.includes(c) ? c : "sans-serif";
}

function axisDefault(tag, min, max) {
  const clamp = (v) => Math.min(max, Math.max(min, v));
  if (tag === "wght") return clamp(400);
  if (tag === "opsz") return clamp(14);
  return min;
}

function toAxes(item) {
  if (!item.axes || item.axes.length === 0) return undefined;
  return item.axes.map((a) => ({
    tag: a.tag,
    min: a.start,
    max: a.end,
    defaultValue: axisDefault(a.tag, a.start, a.end),
  }));
}

// Google's FAMILY_TAGS include a /Expressive/* mood layer (Cute, Playful, …) with
// a 0–100 weight. Keep only those, as the bare leaf name + weight, strongest
// first — they drive the clickable "feeling" pills on each card. Other namespaces
// (/Sans, /Serif, /Technology…) are left out; genre is already the category.
function toFeelings(item) {
  if (!item.tags || item.tags.length === 0) return undefined;
  const feelings = item.tags
    .map((t) => {
      const m = /^\/Expressive\/(.+)$/.exec(t.name);
      return m ? { name: m[1], weight: t.weight } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.weight - a.weight);
  return feelings.length ? feelings : undefined;
}

async function fetchSorted(key, sort, capabilities = []) {
  const params = new URLSearchParams({ key, sort });
  for (const c of capabilities) params.append("capability", c);
  const res = await fetch(`${WEBFONTS_ENDPOINT}?${params.toString()}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Google Webfonts API failed (${res.status}). ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.items ?? [];
}

async function main() {
  const key = readApiKey();

  // One call carries families + axes + feeling tags in popularity order; a second
  // supplies trending ranks. (capability params augment the response, they don't
  // filter the set — FAMILY_TAGS just adds the `tags` array.)
  const [base, trending] = await Promise.all([
    fetchSorted(key, "popularity", ["WOFF2", "VF", "FAMILY_TAGS"]),
    fetchSorted(key, "trending").catch(() => []),
  ]);

  const trendingRankByFamily = new Map();
  trending.forEach((item, i) => trendingRankByFamily.set(item.family, i));

  const families = base.map((item, i) => ({
    family: item.family,
    category: normalizeCategory(item.category),
    variants: item.variants,
    axes: toAxes(item),
    feelings: toFeelings(item),
    subsets: item.subsets,
    popularityRank: i,
    trendingRank: trendingRankByFamily.get(item.family),
    lastModified: item.lastModified,
  }));

  const catalog = { fetchedAt: new Date().toISOString(), families };
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(catalog, null, 2), "utf8");
  console.log(`Wrote ${families.length} families to ${path.relative(ROOT, OUT_FILE)}`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
