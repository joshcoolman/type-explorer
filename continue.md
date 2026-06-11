# Continue

## Where we are

**type-explorer** is fully built and working live. All four SPEC.md phases are
done, plus a persistent-pairings feature, several UI refinements, and a
seed-on-first-run system. The app has been verified end-to-end in the browser
(catalog, proposals, generation, the new Brief workspace). The user has **more
changes coming** and is picking this up with fresh context.

Dev server note: **type-explorer runs on http://localhost:3001** — `:3000` is a
different project (repo-explorer). The user runs the server themselves (house
rule: never run `npm run dev`). Both API keys are present in `.env.local`
(ANTHROPIC_API_KEY + GOOGLE_FONTS_API_KEY).

## What exists (the whole app)

Phases 1–4 from `SPEC.md` are complete: catalog layer (`lib/catalog.ts`, cached
to `data/fonts.json`), `lib/css2-url.ts` (10 passing unit tests — the one fiddly
pure fn), Browse view, tier-1 proposals (`lib/propose.ts`, plain Anthropic SDK,
forced tool use, catalog-validated), tier-2 generation (`lib/generate.ts`, Agent
SDK + vendored `.claude/skills/type-specimen/` skill with a hand-written
`template.html`), jobs/store/SSE infra, and the API routes. Models:
`claude-sonnet-4-6` (proposals), `claude-opus-4-8` (generation).

## Work done in the most recent session (ALL UNCOMMITTED)

Everything below is uncommitted on top of commit `bfb88c7` (the initial commit).

1. **Catalog `capability` fix** (`lib/catalog.ts`) — the Webfonts API wants
   `capability` as repeated params (`&capability=WOFF2&capability=VF`), not
   comma-joined. Was causing a 400. Fixed + verified live (1945 families, 557
   with VF axes).

2. **Persistent pairings + non-blocking Brief** (the big feature):
   - `lib/types.ts` — added `SavedPairing` (PairingProposal + id/brief/lockedFont/
     createdAt/specimenId).
   - `lib/pairings-store.ts` (NEW) — SSR-safe localStorage CRUD, key
     `type-explorer:pairings`, dedupe by `${display}|${text}` lowercased.
   - Extracted `ProgressPanel.tsx` and `SpecimenViewer.tsx` (NEW) out of
     `LibraryView.tsx` so both Library and Brief reuse them.
   - `app/explorer.tsx` — `startGeneration` now returns the SpecimenMeta and does
     NOT change the view (Browse navigates to Library itself; Brief stays put).
     Added **poor-man's polling**: while any specimen is `running`, re-poll
     `/api/specimens` every 4s so statuses flip running→done without manual
     refresh. Added `deleteSpecimen` shared handler.
   - `app/components/BriefView.tsx` — rewritten as a split-pane workspace:
     persisted pairing cards (right), an active log/specimen pane (left). Hydrates
     pairings from localStorage on mount; accumulates across briefs; "More
     options" excludes shown pairs. Status per card derived from the linked
     specimen (deleting a specimen reverts its card to "Generate" for free).

3. **UI refinements (all verified in-browser):**
   - Pairing card leads with a small muted **pill** `Display / Text` (display
     first, text second by convention); sample headline + body render
     uninterrupted below (no inline name labels).
   - **Generate is non-blocking** — clicking it flips the card to a "View
     progress" button + "GENERATING" badge; it does NOT auto-open the log. The
     user clicks "View progress" to open the left pane.
   - `SpecimenViewer` — replaced the "Open raw" text with an **open-in-new-tab
     icon** and added a **download icon** (saves `<slug>-specimen.html`). Inline
     SVGs, no emoji (house rule). Delete stayed a text button.
   - Left pane's "← Back to ideas" replaced with an **X close icon** (top-right).

4. **Seed-on-first-run** (just finished):
   - `seed/` (NEW, tracked) — `seed/index.json` + `seed/specimens/*.html`, four
     curated pre-built specimens: playfair-display-lato, bitter-nunito,
     bungee-oswald, barlow-condensed-merriweather (dropped the duplicate
     Bitter × Lato for variety; ids are slugs matching the filenames).
   - `lib/store.ts` — `seedIfEmpty()` runs once on first `readIndex()`: if
     `data/index.json` is absent, copies the seed HTML into `data/specimens/` and
     writes the manifest. Pure file copy, **no agent, no cost**. Never overwrites
     existing data. Verified in a temp dir (empty data/ → 4 specimens copied).
   - README updated to document it.

## Conventions / gotchas

- `data/` is gitignored (runtime state); `seed/`, `examples/`, and `.env.example`
  are tracked.
- All font metadata flows through `lib/catalog.ts`; the agent never invents axes.
  `lib/css2-url.ts` is the only unit-tested pure fn — extend its tests when
  touching axis rules.
- New React-compiler lint rules (`react-hooks/set-state-in-effect`,
  `purity`) are strict; mount/one-time-fetch effects carry scoped
  `eslint-disable` lines. `Date.now()` must not be called in render (only in
  effects).
- The TS language-server intermittently reports spurious "Cannot find module
  'react'/'fs'" diagnostics — ignore them; `npm run build` is the source of truth.

## Status checks (all green)

`npm run build` clean · `npm run lint` clean · `npm test` 10/10.

## Outstanding

- The user has **additional changes** to request next — wait for direction.
- **Nothing is committed since `bfb88c7`.** When ready, suggested grouping:
  (1) catalog capability fix, (2) persistent pairings + non-blocking Brief +
  extracted components + polling, (3) UI polish (pill, viewer icons, close icon),
  (4) seed-on-first-run + README. Or squash to taste.
- Stray untracked `pnpm-lock.yaml` in the tree (project uses npm /
  `package-lock.json`) — probably wants deleting or gitignoring; confirm with the
  user.
- End-to-end generation, proposals, browse, the split-pane log, polling, viewer
  icons, and seeding have all been verified live this session.

## Git state

Branch `main`, one commit `bfb88c7`. No remote. Working tree has the uncommitted
changes listed above:
- Modified: README.md, lib/catalog.ts, lib/store.ts, lib/types.ts,
  app/explorer.tsx, app/components/{BriefView,LibraryView}.tsx
- New: lib/pairings-store.ts, app/components/{ProgressPanel,SpecimenViewer}.tsx,
  seed/
- Untracked stray: pnpm-lock.yaml

Last files edited: `lib/store.ts` (seeding), `seed/` (pre-built specimens),
`README.md`.
