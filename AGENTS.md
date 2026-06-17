# Type Explorer — Agent Guide

A Next.js (App Router, Turbopack) app for browsing Google Fonts as full-size
specimens and discovering display + text pairings. Personal project / work
sample. See `README.md` for the product story; this file is the map for working
in the code.

## Stack

- Next.js 16 (App Router) + React, TypeScript strict
- Tailwind CSS (design tokens in `app/globals.css`)
- Vitest for tests
- Static data: font catalog and pairing library are pre-built JSON, not live APIs

## Commands

- `npm run build` — production build; **use this to verify changes** (do not run `npm run dev`; the user runs the dev server)
- `npm run test` — Vitest run
- `npm run lint` — ESLint
- `npm run catalog:refresh` — rebuild the static font catalog (`scripts/build-catalog.mjs`)
- `npm run pairings:build` — rebuild the static pairing library (`scripts/build-pairing-library.mjs`)

## Key files

| Area | File(s) | Touch when… |
|---|---|---|
| Fonts browser (browse, search, filter, voice) | `app/components/BrowseView.tsx` | changing the catalog grid, controls, or page wiring |
| Single specimen card | `app/components/FontSpecimenCard.tsx` | card layout; owns `VoiceCopy` type + `DEFAULT_VOICE` |
| Typographic voice editor | `app/components/TypographicVoiceModal.tsx` | the voice pop-up (title/subtitle/paragraph overrides) |
| Pairings overlay | `app/components/SuggestedPairingsModal.tsx`, `PairingCard.tsx`, `SuggestedPairings.tsx` | pairing UI / cards |
| Favorites | `app/components/FavoritesView.tsx`, `lib/favorites.ts` | gather/favorite behavior (localStorage-backed) |
| Design-system primitives | `app/components/ui/*` (import via `ui/index.ts` barrel) | shared Button/Card/Panel/Input/Textarea/Grid/Label/typeRoles |
| Per-card theming | `lib/card-themes.ts` | light/dark specimen themes, `PAGE_THEME` |
| Font loading | `lib/font-loader.ts`, `lib/css2-url.ts` (+ `css2-url.test.ts`) | Google Fonts CSS2 URL building / loading |
| Static data | `lib/catalog.ts`, `lib/pairing-library.ts`, `lib/specimen-samples.ts` | catalog/pairing/sample-copy data access |
| Fonts API | `app/api/fonts/route.ts` | search / sort / paginate endpoint behind the explorer |
| Shared types | `lib/types.ts` | `FontFamily` and other cross-module types |
| Pages / shell | `app/page.tsx` (Fonts browser — root), `app/pairings/page.tsx` (pairings showcase) + `app/pairings/[slug]/page.tsx` (per-font pairings, SSG), `app/favorites/page.tsx`, `app/explorer/page.tsx` (redirects to `/`), `app/layout.tsx`, `app/components/GlobalNav.tsx` | routes and app shell |
| Changelog | `content/changelog.json` (data), `app/changelog/page.tsx` (page), `.claude/commands/changes.md` (`/changes`) | recording user-facing changes |
| Design docs | `docs/design-system.md` | design-system reference |

## Conventions & gotchas

- **Verify with `npm run build`**, not the dev server. Fix all errors until the build passes.
- **No emojis** anywhere — code, docs, or UI.
- UI primitives carry no color; per-card light/dark themes flow through via `className`/`style` (see `Card.tsx`). Reach for `app/components/ui` before hand-rolling markup.
- Overlays (e.g. the voice editor) share one pattern: fixed overlay, Escape to close, backdrop-click to close, `document.body` scroll lock. Copy `TypographicVoiceModal.tsx` rather than reinventing. (Pairings are no longer an overlay — they're the `/pairings/[slug]` route.)
- State like favorites and typographic voice persists to `localStorage`; hydrate after mount to avoid SSR mismatch (see the `readVoice` pattern in `BrowseView.tsx`).
- The font catalog and pairing library are **static JSON built offline** via the `catalog:refresh` / `pairings:build` scripts — not fetched live at runtime.
- **Cards**: every card surface (Explorer, Home, pairings) renders the one presentational base `SpecimenCard` inside the one `Grid`. Add card variation through props/the `footer` slot, not new card shells.
- **Light surfaces**: wrap a self-contained surface in the `theme-light` class (`globals.css`) to flip it to the warm cream "light mode"; the usual semantic utilities re-resolve. The site itself stays dark.
- **Changelog**: a changelog entry is part of committing user-facing work, not an afterthought — when committing/pushing feature work to `main`, add an entry to `content/changelog.json` (newest-first) **in the same commit** (or run `/changes` to draft one). There is no hook enforcing this; it's a convention. Trivial commits (typo, dep bump) can skip it. Keep bullets user-facing. Each entry's `files[]` notes the key files it touched, so this file doubles as recent-work memory: **skim `content/changelog.json` first to orient on what changed lately and where it lives** before diving into this map.

## Product direction

Focus is **browse + gather/favorite**. An earlier AI/specimen-generation and
live-pairing-engine direction was parked (see `docs/` if present). Keep v1
focused; confirm before reviving parked scope.
