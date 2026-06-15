# Continue

## What was being worked on

Refocusing **type-explorer** (Next.js 16 App Router, React 19, Tailwind v4, TS)
around a **graze-and-gather** model: browse fonts/pairings, collect with a heart,
view your collection. Three surfaces now: **Home** (curated pairings), **Explorer**
(single-font specimen catalog over the full Google Fonts library), **Favorites**.
Pairing-as-workflow and AI specimen generation were pulled OUT of the UX but left
intact in the repo (documented as parked). House rules: never run `npm run dev`
(user runs server on :3000); always confirm a production `npm run build` passes;
no emoji in code/UI.

## Changes made so far (committed — see Git state)

Earlier in session (single-font specimen cards + icon filter):
- **`app/components/FontSpecimenCard.tsx`** (new) — single-font specimen card:
  bold (700) header, regular (400) subtitle + running paragraph, all in the same
  family, mono font-name label at bottom. Alternating light/dark fields via
  `themeForIndex`. Lazy-loads its font on scroll (IntersectionObserver +
  `loadPreviewFont(family,[400,700])`). Exports `DEFAULT_VOICE` (the fixed default
  copy: "Letters That Carry the Weight" / subtitle / paragraph) used as fallback
  for every blank voice field. Props now also: `favorited?`, `onToggleFavorite?`.
- **`app/components/BrowseView.tsx`** — restyled Explorer Browse: kept the data
  layer (debounced search, CATEGORIES, SORTS, `/api/fonts` paging, Load more),
  swapped FontCard grid → FontSpecimenCard grid, dropped selection/generate.
  Added a gear "Typographic voice" panel (Title/Subtitle/Paragraph, textarea for
  paragraph) persisted to localStorage `type-explorer:voice`. Wires favorites.
- **`lib/specimen-samples.ts`** — added `body` to `SampleCopy` + 8 samples (home
  PairingCard ignores it; single source preserved).
- **`app/api/fonts/route.ts`** — added `isIconFont` predicate
  (`/\b(icons?|symbols?|emoji)\b/i`) filtering icon/symbol/emoji families from the
  browse listing (display-only; catalog/generation still see them). Verified: 13
  matches, zero false positives, 1932 families served.

This session (favorites + strip pairing/AI from UX):
- **`lib/types.ts`** — added `Pairing` interface (moved out of SuggestedPairings).
- **`lib/favorites.ts`** (new) — localStorage store key `type-explorer:favorites`
  `{ fonts: FontFamily[], pairings: Pairing[] }`. Exports `useFavorites()`
  (useSyncExternalStore, cross-tab via storage event), `isFontFavorite`,
  `isPairingFavorite`, `toggleFontFavorite`, `togglePairingFavorite`.
- **`app/components/FavoriteButton.tsx`** (new) — heart toggle (outline→filled),
  takes `active`, `onToggle`, `color`, `activeColor`, `label`. NO "use client"
  directive on purpose (only imported by client components; avoids the Next 16
  serializable-props entry-boundary warning).
- **`app/components/PairingCard.tsx`** — added `favorited?`/`onToggleFavorite?`,
  heart at top-right (theme.muted outline, theme.accent fill), `pr-10` on h2.
- **`app/components/SuggestedPairings.tsx`** — imports Pairing from lib/types now;
  calls `useFavorites()`, passes favorited + togglePairingFavorite to each card.
- **`app/components/FavoritesView.tsx`** (new) + **`app/favorites/page.tsx`** (new)
  — `/favorites` route. PAGE_THEME chrome like Home. Two sections, "Pairings N"
  and "Fonts N", each card favoritable (filled heart; toggling removes reactively).
  Font cards render with `DEFAULT_VOICE`. Empty state when nothing collected.
- **`app/components/GlobalNav.tsx`** — added `{ href:"/favorites", label:"Favorites" }`.
  Nav is Home / Explorer / Favorites (kept "Explorer" name per decision).
- **`app/explorer.tsx`** — STRIPPED from the big tabbed component to a slim shell:
  `h-screen` flex col, a header bar, and `<BrowseView />`. Removed Brief/Library
  tabs, LibrarySidebar, GridView card-view toggle, SettingsPanel, all generation
  state/handlers.
- **`docs/parked-pairing-and-ai.md`** (new) — documents what's parked (BriefView,
  LibraryView, LibrarySidebar, GridView, SettingsPanel, SpecimenViewer,
  ProgressPanel, FontCard; lib generate/propose/jobs/store/specimen-*/palette;
  api jobs/specimens/proposals) and the **deterministic revisit path**: build a
  researched JSON pairing catalog (roles: header/subhead/body), render specimens
  deterministically, reserve AI for offline batch / "surprise me".

## Key decisions

- **Graze-and-gather over pairing-first.** Pairing is not an upfront assumption.
  Favoriting (single fonts AND pairings) is the core verb; a Favorites view is the
  collection. Confirmed via AskUserQuestion: full strip of Explorer, fonts+pairings
  in one Favorites view, keep "Explorer" nav name.
- **AI parked, not deleted.** Per-request AI is expensive and pairing/specimen are
  largely deterministic/solved — keep code intact, revisit as a JSON catalog.
- Favorites are local-only (localStorage), no backend. Store full FontFamily /
  Pairing objects so Favorites view renders without refetching.
- Single fixed default specimen copy (`DEFAULT_VOICE`) for all cards, overridable
  via the voice panel — emphasizes that many fonts work alone.

## Outstanding work / next steps

- Not built (intentionally parked): the deterministic JSON pairing catalog + a
  "Pair this" affordance on specimen cards; reviving Brief/Library if ever wanted.
- Parked components still typecheck/build but are unmounted — safe to delete later
  if the deterministic path is chosen instead of reviving them.
- Optional: "Source Sans Pro" → "Source Sans 3" stale name in suggested-pairings JSON.

## Git state

Branch **main**, clean and pushed (up to date with `origin/main`). All of the
above shipped in commit **`0a61ba2`** "Refocus app on graze-and-gather; park
pairing + AI generation". Production build passes clean (routes: /, /explorer,
/favorites). Nothing outstanding to commit; the next session starts from a clean
tree.
