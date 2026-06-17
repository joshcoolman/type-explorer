# Pairings

How Type Explorer surfaces display + text font pairings. Two distinct surfaces
share one card and one data shape but come from different places.

## The two surfaces

- **Showcase** (`/pairings`, `app/pairings/page.tsx` → `SuggestedPairings.tsx`) —
  a hand-mined gallery of notable pairings across many fonts. Data:
  `content/suggested-pairings.json`. This was the old home page.
- **Per-font pairings** (`/pairings/[slug]`, `app/pairings/[slug]/page.tsx` →
  `PairingsView.tsx`) — for one source font, its curated picks plus algorithmic
  suggestions. Data: `content/pairing-library.json`, keyed by family name.
  Reached via the "Get Pairings" link on a `FontSpecimenCard`.

Both render `PairingCard` (→ the shared `SpecimenCard`), so a pairing from either
surface can be favorited identically.

## The engine (per-font)

Pairings are **built offline, not computed at runtime** — see
[data-pipeline.md](./data-pipeline.md) (`pairings:build`). Per source font, two
merged sources:

1. **Curated** — hand-collected pairs, honoring a display/text role so faces land
   the right way round.
2. **Algorithmic** — interpretable contrast scoring over Google Fonts' own
   semantic tags (`FAMILY_TAGS`): a 20-dimension `/Expressive` mood vector + genre
   tags + a body-utility/popularity prior. Genre contrast dominates; mood adds
   harmony and the human-readable "why". Top 6 partners per font. **Not** a
   fontjoy-style CNN.

`groupedPairingsFor(source, entry)` in `lib/pairing-library.ts` turns a library
entry into renderable curated + suggested pairings with stable ids (so favoriting
dedupes). The page shows them as one ungrouped set, curated first.

## Routes & slugs

`/pairings/[slug]` is **SSG** — `generateStaticParams()` pre-renders one page per
font in the library (~1,900). `lib/slug.ts` is the single source of truth for
`family ↔ slug` (e.g. `Playfair Display ↔ playfair-display`), used by the link,
`generateStaticParams`, and the page's reverse-lookup. `notFound()` for unknown
slugs.

## Key files

- `app/pairings/[slug]/page.tsx` — per-font page (SSG, GridAlign header, circular caret back button)
- `app/components/PairingsView.tsx` — the shared pairings grid
- `app/pairings/page.tsx` + `app/components/SuggestedPairings.tsx` — the showcase
- `lib/pairing-library.ts` — `groupedPairingsFor`, types, lazy JSON loader
- `lib/slug.ts` — family ↔ slug
- `content/pairing-library.json` / `content/suggested-pairings.json` — the data

## History / parked

Bookmarkable routes (this design) shipped — see the closed item in `BACKLOG.md`.
Still open: the **split-panel pairing view** (select a card in-grid, pairings fill
the remaining columns) — this routing is the URL layer that interaction would sit
on. An earlier live pairing-engine / AI direction was parked.
