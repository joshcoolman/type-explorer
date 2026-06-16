// Build the static pairing library the magic-icon feature reads from.
//
//   node scripts/build-pairing-library.mjs
//
// Two sources, merged per source-font:
//   1. CURATED  — hand-collected pairs in app/raw-font-dump/{serif,sans-serif}.md
//   2. ALGORITHMIC — interpretable contrast scoring over Google Fonts' own
//      hand-curated semantic tags (capability=FAMILY_TAGS): a /Expressive mood
//      vector + genre tags + body-utility. Offline, deterministic, full-coverage,
//      and every suggestion carries a human-readable "why".
//
// Output: content/pairing-library.json — small, keyed by family name.
//
// The tag data is cached to content/font-tags.json on first run (needs
// GOOGLE_FONTS_API_KEY); subsequent runs are fully offline. Delete that file to
// refresh tags.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TAGS_FILE = path.join(ROOT, "content", "font-tags.json");
const OUT_FILE = path.join(ROOT, "content", "pairing-library.json");

const TOP_K = 6; // algorithmic partners kept per source font

// Scorer weights — fit against the curated dumps as ground truth. Genre contrast
// is the dominant signal; mood adds font-specific harmony (and the "why"); a mild
// popularity prior keeps suggestions to recognizable, usable faces.
const W_MOOD = 0.5;
const W_POP = 0.3;

// Curated dumps reference a few fonts by an old/foundry name; map the loadable ones.
const RENAMES = {
  "Source Sans Pro": "Source Sans 3",
  "Source Serif Pro": "Source Serif 4",
};

// The 20 /Expressive/* dimensions form the mood vector.
const EXPRESSIVE = [
  "Active", "Artistic", "Awkward", "Business", "Calm", "Childlike", "Competent",
  "Cute", "Excited", "Fancy", "Futuristic", "Happy", "Innovative", "Loud",
  "Playful", "Rugged", "Sincere", "Sophisticated", "Stiff", "Vintage",
];
const EXPR_IDX = new Map(EXPRESSIVE.map((n, i) => [n, i]));

// ---------------------------------------------------------------------------
// Catalog (the fonts the app can actually render) + tags.
// ---------------------------------------------------------------------------
const catalog = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "fonts.json"), "utf8"),
);
const families = catalog.families ?? catalog;
const catalogSet = new Set(families.map((f) => f.family));
const categoryOf = new Map(families.map((f) => [f.family, f.category]));
const variantsOf = new Map(families.map((f) => [f.family, f.variants]));
const popRank = new Map(families.map((f, i) => [f.family, i]));
const N = families.length;

async function loadTags() {
  if (fs.existsSync(TAGS_FILE)) {
    return JSON.parse(fs.readFileSync(TAGS_FILE, "utf8"));
  }
  // First run: fetch from the Google Fonts Developer API and cache.
  const env = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
  const key = env.match(/^GOOGLE_FONTS_API_KEY=(.+)$/m)?.[1]?.trim();
  if (!key) throw new Error("GOOGLE_FONTS_API_KEY not found in .env.local");
  const url = `https://www.googleapis.com/webfonts/v1/webfonts?key=${key}&sort=popularity&capability=FAMILY_TAGS`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Fonts API ${res.status}`);
  const data = await res.json();
  const tags = (data.items ?? []).map((f) => ({
    family: f.family,
    tags: f.tags ?? [],
  }));
  fs.writeFileSync(TAGS_FILE, JSON.stringify(tags));
  return tags;
}

// ---------------------------------------------------------------------------
// Per-font features derived from tags.
// ---------------------------------------------------------------------------
function moodVector(tags) {
  const v = new Float64Array(EXPRESSIVE.length);
  for (const t of tags) {
    const m = t.name.match(/^\/Expressive\/(.+)$/);
    if (m && EXPR_IDX.has(m[1])) v[EXPR_IDX.get(m[1])] = t.weight / 100;
  }
  return v;
}

// The strongest structural sub-genre tag, e.g. {group:"Sans", sub:"Geometric"}.
function genreTag(tags) {
  let best = null;
  let bestW = -1;
  for (const t of tags) {
    const m = t.name.match(/^\/(Sans|Serif|Slab|Script|Monospace)\/(.+)$/);
    if (m && t.weight > bestW) {
      bestW = t.weight;
      best = { group: m[1], sub: m[2] };
    }
  }
  return best;
}

// A script / decoration-heavy face is rarely a tasteful partner — exclude it.
function isDecorative(family, tags) {
  if (categoryOf.get(family) === "handwriting") return true;
  for (const t of tags) {
    if (/^\/(Script|Theme)\//.test(t.name) && t.weight >= 50) return true;
  }
  return false;
}

function hasBodyUtility(family) {
  const v = variantsOf.get(family) ?? [];
  return (
    v.includes("regular") &&
    (v.includes("700") || v.includes("600") || v.includes("500"))
  );
}

// Genre group for contrast: the tag group, falling back to the catalog category.
function genreGroup(family, feat) {
  if (feat.genre) return feat.genre.group;
  const c = categoryOf.get(family);
  if (c === "serif") return "Serif";
  if (c === "monospace") return "Monospace";
  if (c === "display") return "Display";
  return "Sans";
}

function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

// ---------------------------------------------------------------------------
// "Why" — a short, truthful rationale from the two fonts' actual features.
// ---------------------------------------------------------------------------
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function genreLabel(family, feat) {
  if (feat.genre) {
    const group = feat.genre.group === "Monospace" ? "mono" : feat.genre.group.toLowerCase();
    return `${feat.genre.sub.toLowerCase()} ${group}`.replace("monospace ", "");
  }
  const c = categoryOf.get(family);
  return c === "sans-serif" ? "sans" : c === "monospace" ? "mono" : c;
}

function whyFor(a, fa, b, fb) {
  // Shared tone: the /Expressive dim both fonts rank high on — but biased toward
  // rarer, more characterful tags (Calm, Playful) over ubiquitous ones (Business,
  // Rugged) via inverse document frequency, so the rationale doesn't read generic.
  let tone = null;
  let best = 0;
  for (let i = 0; i < EXPRESSIVE.length; i++) {
    const shared = Math.min(fa.mood[i], fb.mood[i]); // 0..1
    if (shared * 100 < 50) continue; // require a real signal on both
    const ranked = shared * EXPR_IDF[i];
    if (ranked > best) {
      best = ranked;
      tone = EXPRESSIVE[i];
    }
  }
  const ga = genreLabel(a, fa);
  const gb = genreLabel(b, fb);
  const contrast = ga === gb ? cap(ga) : `${cap(ga)} × ${gb}`;
  return tone ? `Both ${tone.toLowerCase()}; ${contrast}` : contrast;
}

// ---------------------------------------------------------------------------
// 1. Curated dumps → per-source curated partners (first = display, second = text)
// ---------------------------------------------------------------------------
function canonical(raw) {
  let name = raw.trim().replace(/\s*\((?:Regular|Bold|Medium|Light)\)\s*$/i, "");
  name = RENAMES[name] ?? name;
  return catalogSet.has(name) ? name : null;
}

function parseCurated() {
  const curated = new Map(); // family -> [{ family, role }]
  const dropped = new Set();
  const seenPair = new Set();
  let lines = 0;

  for (const file of ["serif.md", "sans-serif.md"]) {
    const text = fs.readFileSync(
      path.join(ROOT, "app", "raw-font-dump", file),
      "utf8",
    );
    for (const line of text.split("\n")) {
      const m = line.split(" & ");
      if (m.length !== 2) continue;
      lines++;
      const aRaw = m[0].trim();
      const bRaw = m[1].trim();
      const a = canonical(aRaw);
      const b = canonical(bRaw);
      if (!a) dropped.add(aRaw.replace(/\s*\([^)]*\)\s*$/, ""));
      if (!b) dropped.add(bRaw.replace(/\s*\([^)]*\)\s*$/, ""));
      if (!a || !b || a === b) continue;
      const key = `${a}|${b}`;
      if (seenPair.has(key)) continue;
      seenPair.add(key);
      if (!curated.has(a)) curated.set(a, []);
      curated.get(a).push({ family: b, role: "text" });
      if (!curated.has(b)) curated.set(b, []);
      curated.get(b).push({ family: a, role: "display" });
    }
  }
  return { curated, dropped, lines, pairs: seenPair.size };
}

// ---------------------------------------------------------------------------
// 2. Build features + score.
// ---------------------------------------------------------------------------
const tagData = await loadTags();
const tagsOf = new Map(tagData.map((t) => [t.family, t.tags]));

// Feature table for every catalog font that has tags.
const feat = new Map();
for (const f of families) {
  const tags = tagsOf.get(f.family);
  if (!tags) continue;
  feat.set(f.family, {
    mood: moodVector(tags),
    genre: genreTag(tags),
    decorative: isDecorative(f.family, tags),
  });
}
const pool = [...feat.keys()];

// Inverse document frequency per /Expressive dim — how rare a strong (>=50)
// signal is across the corpus. Used only to pick a characterful shared tone.
const EXPR_IDF = (() => {
  const df = new Float64Array(EXPRESSIVE.length);
  for (const f of pool) {
    const m = feat.get(f).mood;
    for (let i = 0; i < m.length; i++) if (m[i] >= 0.5) df[i]++;
  }
  return Array.from(df, (c) => Math.log(pool.length / (c + 1)));
})();

function eligiblePartner(family) {
  return !feat.get(family).decorative;
}

function score(a, b) {
  const fa = feat.get(a);
  const fb = feat.get(b);
  let s = 0;
  if (genreGroup(a, fa) !== genreGroup(b, fb)) s += 1.0; // genre contrast (dominant)
  s += hasBodyUtility(b) ? 0.3 : -0.5; // partner should work as text
  s += W_MOOD * cosine(fa.mood, fb.mood); // mood harmony (differentiation)
  s += W_POP * (1 - (popRank.get(b) ?? N) / N); // recognizable-font prior
  return s;
}

function buildSuggested() {
  const suggested = new Map();
  for (const a of pool) {
    const scored = [];
    for (const b of pool) {
      if (b === a || !eligiblePartner(b)) continue;
      scored.push({ family: b, score: score(a, b) });
    }
    scored.sort((x, y) => y.score - x.score);
    suggested.set(
      a,
      scored.slice(0, TOP_K).map((s) => ({
        family: s.family,
        score: Math.round(s.score * 1000) / 1000,
        why: whyFor(a, feat.get(a), s.family, feat.get(s.family)),
      })),
    );
  }
  return suggested;
}

// Sanity-check the scorer against the curated pairs (reported, not enforced).
function validate(curated) {
  const ranks = [];
  for (const [a, partners] of curated) {
    if (!feat.has(a)) continue;
    const ranked = pool
      .filter((b) => b !== a && eligiblePartner(b))
      .map((b) => ({ b, s: score(a, b) }))
      .sort((x, y) => y.s - x.s)
      .map((x) => x.b);
    for (const p of partners) {
      if (!feat.has(p.family)) continue;
      const r = ranked.indexOf(p.family);
      if (r >= 0) ranks.push(r);
    }
  }
  if (!ranks.length) return null;
  ranks.sort((a, b) => a - b);
  const within = (n) => ranks.filter((r) => r < n).length;
  return {
    samples: ranks.length,
    pool: pool.length,
    median: ranks[Math.floor(ranks.length / 2)],
    top10: ((within(Math.round(pool.length * 0.1)) / ranks.length) * 100).toFixed(0),
    top25: ((within(Math.round(pool.length * 0.25)) / ranks.length) * 100).toFixed(0),
  };
}

// ---------------------------------------------------------------------------
// 3. Merge + write.
// ---------------------------------------------------------------------------
const { curated, dropped, lines, pairs } = parseCurated();
const suggested = buildSuggested();
const stats = validate(curated);

const library = {};
for (const family of new Set([...curated.keys(), ...suggested.keys()])) {
  const cur = [];
  const curSeen = new Set();
  for (const c of curated.get(family) ?? []) {
    if (c.family === family || curSeen.has(c.family)) continue;
    curSeen.add(c.family);
    cur.push(c);
  }
  const sug = (suggested.get(family) ?? []).filter(
    (s) => !curSeen.has(s.family),
  );
  if (cur.length === 0 && sug.length === 0) continue;
  library[family] = {
    category: categoryOf.get(family) ?? null,
    curated: cur,
    suggested: sug,
  };
}

const sorted = {};
for (const k of Object.keys(library).sort()) sorted[k] = library[k];
fs.writeFileSync(OUT_FILE, JSON.stringify(sorted, null, 2) + "\n");

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------
console.log("Curated dumps:");
console.log(`  ${lines} lines -> ${pairs} unique pairs`);
console.log(`  dropped (not loadable Google Fonts): ${dropped.size}`);
console.log("   ", [...dropped].sort().join(", "));
console.log("Google Fonts tags:");
console.log(`  ${feat.size} catalog fonts with tags`);
if (stats)
  console.log(
    `  validation vs curated: ${stats.samples} samples, pool ${stats.pool}, median rank ${stats.median}, top10% ${stats.top10}%, top25% ${stats.top25}%`,
  );
console.log("Library:");
console.log(`  ${Object.keys(sorted).length} source fonts -> ${OUT_FILE}`);
for (const probe of ["Lora", "Playfair Display", "Bebas Neue"]) {
  const e = sorted[probe];
  if (e) {
    console.log(`  ${probe}:`);
    for (const s of e.suggested) console.log(`    ${s.family} — ${s.why}`);
  }
}
