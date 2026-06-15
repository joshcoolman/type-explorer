#!/usr/bin/env node
/**
 * Mine font pairings out of a scraped HTML dump into the Suggested Pairings
 * catalog (`content/suggested-pairings.json`).
 *
 * The dump encodes each pairing as an <h2> heading (the display face, with the
 * human "Name & Name" label) followed by a body <p> (the text face), both
 * tagged with `data-font-type` / `data-font-name` attributes. We pull those out
 * in document order and zip them 1:1.
 *
 * Usage:
 *   node scripts/mine-pairings.mjs [dumpPath] [--report]
 *
 *   dumpPath   HTML dump to read (default: pairings-dump.md)
 *   --report   cross-check font names against data/fonts.json (the cached
 *              Google catalog) and warn on names missing from it. Advisory only.
 *
 * The merge is append-only: existing pairings (matched by id) are kept, new
 * ones are added. Re-running on a fresh dump only grows the catalog.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const args = process.argv.slice(2);
const report = args.includes("--report");
const dumpPath = resolve(args.find((a) => !a.startsWith("--")) ?? "pairings-dump.md");
const outPath = resolve("content/suggested-pairings.json");

// ----- name cleaning -----

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#39;/g, "'").trim();

/** Strip trailing weight parentheticals: "Vend Sans (Bold)" -> "Vend Sans". */
const cleanName = (s) => decode(s).replace(/\s*\([^)]*\)\s*$/, "").trim();

/** Slug for the id / dedupe key. */
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// ----- extract -----

const html = readFileSync(dumpPath, "utf8");

const headingRe =
  /<h2[^>]*data-font-name="([^"]*)"[^>]*>([^<]*)<\/h2>/g;
const bodyRe = /data-font-type="body"\s+data-font-name="([^"]*)"/g;

const headings = [...html.matchAll(headingRe)].map((m) => ({
  font: cleanName(m[1]),
  label: decode(m[2]),
}));
const bodies = [...html.matchAll(bodyRe)].map((m) => cleanName(m[1]));

console.log(`Found ${headings.length} headings, ${bodies.length} body faces in ${dumpPath}`);
if (headings.length !== bodies.length) {
  console.warn(
    `WARN: heading/body count mismatch (${headings.length} vs ${bodies.length}); zipping by index.`,
  );
}

const n = Math.min(headings.length, bodies.length);
const mined = [];
const seen = new Set();
let dupes = 0;
let monovoice = 0;

for (let i = 0; i < n; i++) {
  const heading = headings[i].font;
  const body = bodies[i];
  const label = headings[i].label || `${heading} & ${body}`;
  const id = `${slug(heading)}-${slug(body)}`;
  if (seen.has(id)) {
    dupes++;
    continue;
  }
  seen.add(id);
  const isMono = slug(heading) === slug(body);
  if (isMono) monovoice++;
  mined.push({ id, label, heading, body, monovoice: isMono });
}

console.log(`Mined ${mined.length} unique pairings (${dupes} in-dump dupes, ${monovoice} monovoice).`);

// ----- merge (append-only) -----

let existing = [];
if (existsSync(outPath)) {
  try {
    existing = JSON.parse(readFileSync(outPath, "utf8")).pairings ?? [];
  } catch {
    console.warn(`WARN: could not parse existing ${outPath}; starting fresh.`);
  }
}

const byId = new Map(existing.map((p) => [p.id, p]));
let added = 0;
for (const p of mined) {
  if (!byId.has(p.id)) {
    byId.set(p.id, p);
    added++;
  }
}

const pairings = [...byId.values()];

// ----- optional catalog cross-check -----

if (report) {
  const catPath = resolve("data/fonts.json");
  if (existsSync(catPath)) {
    const families = new Set(
      (JSON.parse(readFileSync(catPath, "utf8")).families ?? []).map((f) =>
        f.family.toLowerCase(),
      ),
    );
    const missing = new Set();
    for (const p of pairings) {
      if (!families.has(p.heading.toLowerCase())) missing.add(p.heading);
      if (!families.has(p.body.toLowerCase())) missing.add(p.body);
    }
    if (missing.size) {
      console.warn(
        `\nNOTE: ${missing.size} font(s) not in the Google catalog (will fall back to system fonts):`,
      );
      console.warn("  " + [...missing].sort().join(", "));
    } else {
      console.log("\nAll fonts present in the Google catalog.");
    }
  } else {
    console.warn(`\n--report: ${catPath} not found; run the app once to cache the catalog.`);
  }
}

// ----- write -----

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify({ pairings }, null, 2) + "\n");
console.log(`\nWrote ${pairings.length} pairings (${added} new) to ${outPath}`);
