# Data pipeline

All font data is **pre-built static JSON, committed to the repo**. The app makes
no Google API calls at runtime and needs no API key to host — the build scripts
are the only things that talk to Google, and you run them locally and commit the
output. Three scripts, three outputs.

## Catalog — `npm run catalog:refresh`

`scripts/build-catalog.mjs` fetches the Google Fonts catalog (families, variable-
font axes, popularity / trending order), normalizes it, and writes
**`data/fonts.json`**. This is what the Fonts browser reads (served/paginated via
`app/api/fonts/route.ts`).

- Needs `GOOGLE_FONTS_API_KEY` in `.env.local` (Google Cloud → enable "Web Fonts
  Developer API" → create key).
- Run it to pick up new/updated families, then commit the refreshed JSON.

## Pairing library — `npm run pairings:build`

`scripts/build-pairing-library.mjs` builds **`content/pairing-library.json`** (the
per-font pairings; see [pairings.md](./pairings.md)). Merges curated dumps
(`app/raw-font-dump/*.md`) with algorithmic contrast scoring over Google's
`FAMILY_TAGS`.

- Tag data is cached to `content/font-tags.json` on first run (needs the API key);
  subsequent runs are **fully offline**. Delete that file to refresh tags.
- Deterministic — same inputs produce the same library.

## Showcase pairings — `node scripts/mine-pairings.mjs`

`scripts/mine-pairings.mjs` mines an HTML dump into
**`content/suggested-pairings.json`** (the `/pairings` showcase). Append-only
merge by id — re-running on a fresh dump only grows the catalog. (No npm alias;
run directly. `--report` cross-checks names against `data/fonts.json`.)

## Summary

| Output | Script | Feeds |
|---|---|---|
| `data/fonts.json` | `catalog:refresh` | Fonts browser / `/api/fonts` |
| `content/pairing-library.json` | `pairings:build` | per-font pairings `/pairings/[slug]` |
| `content/suggested-pairings.json` | `mine-pairings.mjs` | showcase `/pairings` |
