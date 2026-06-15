# Parked: pairing flow and AI specimen generation

The app was refocused around **grazing and gathering**: browse single-font
specimens in the Explorer, browse curated pairings on the home page, and collect
either kind with a heart into a **Favorites** view. Pairing-as-a-workflow and the
AI specimen generator were **pulled out of the UX but left intact in the repo**.
This note records what is parked and how to revisit it.

## Why it was parked

- Pairing was an upfront assumption the experience didn't need. A lot of fonts
  stand on their own; forcing a "pick two" path undersells that.
- Per-request AI generation costs money for something that is largely a **solved,
  deterministic problem**. We already have ~96 hand-mined pairings that work.

## The intended revisit path (deterministic, no per-request AI)

1. **Pairing as a JSON catalog.** Build a researched pairing catalog for Google
   Fonts once (offline) — keyed by font, listing good partners and the role each
   plays (header / subhead / body). At runtime it's a fast lookup/search, not a
   model call. Seed from the existing miner: [scripts/mine-pairings.mjs](../scripts/mine-pairings.mjs)
   and [content/suggested-pairings.json](../content/suggested-pairings.json)
   (note the `monovoice` flag already marks single-font "pairings").
2. **Roles, not pairs.** Model a pairing as fonts assigned to roles (1 font =
   monovoice, 2 = display+text, 3 = header/subhead/body) rather than a binary
   display+text match.
3. **Specimen page is deterministic too.** A specimen can be rendered from font
   metadata + fixed copy templates without an LLM in the hot path. Reserve AI for
   an optional one-time offline batch or a "surprise me" escape hatch.

## What is parked (intact, just unwired)

UI components no longer mounted by [app/explorer.tsx](../app/explorer.tsx):

- `app/components/BriefView.tsx` — brief → pairing recommendations
- `app/components/LibraryView.tsx`, `LibrarySidebar.tsx` — generated specimen library
- `app/components/GridView.tsx` — card view of generated specimens
- `app/components/SettingsPanel.tsx` — palette controls
- `app/components/SpecimenViewer.tsx`, `ProgressPanel.tsx` — specimen iframe + job log
- `app/components/FontCard.tsx` — the old technical-fluff browse card (superseded by `FontSpecimenCard.tsx`)

Server/runtime pieces (still present, no longer reached from the UI):

- Generation + proposal logic: `lib/generate.ts`, `lib/propose.ts`, `lib/jobs.ts`,
  `lib/store.ts`, `lib/pairings-store.ts`
- Specimen rendering/copy/control: `lib/specimen-render.ts`, `lib/specimen-copy.ts`,
  `lib/specimen-control.ts`, `lib/palette.ts`
- API routes: `app/api/jobs/*`, `app/api/specimens/*`, `app/api/proposals`

Still in active use: `lib/catalog.ts`, `lib/css2-url.ts`, `lib/font-loader.ts`,
`lib/card-themes.ts`, `lib/specimen-samples.ts`, `lib/favorites.ts`,
`lib/types.ts`, and `app/api/fonts/*`.

## How to revive

- The components above still typecheck and build; re-mount them in
  `app/explorer.tsx` (the pre-strip version added tabs Browse/Brief/Library, a
  sidebar, a card-view toggle, and a palette settings panel) to bring the old flow
  back, or
- Build the deterministic catalog from step 1 and wire a "Pair this" affordance
  on the specimen cards that reads it — no AI required.
