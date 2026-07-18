# Type Explorer — Agent Guide

Next.js 16 (App Router, Turbopack) + React + TS-strict app for browsing Google
Fonts as full-size specimens and discovering display + text pairings. Tailwind
tokens in `app/globals.css`; Vitest for tests. The font catalog and pairing
library are **pre-built static JSON, not live APIs**. Single canonical guide,
auto-loaded each session. (Global `~/.claude/CLAUDE.md` already covers no-emojis,
build-to-verify, never-run-dev, and reporting the last file edited — not repeated
here.)

## Critical: the commit ritual

When committing/pushing user-facing work to `main`, these are part of the
commit — no hook enforces them, they're the easy-to-forget steps:

1. **Changelog** — add a `content/changelog.json` entry (newest-first) **in the
   same commit**, or run `/changes`. Entries' `files[]` double as recent-work
   memory, so **skim the changelog first** to see what changed lately and where.
2. **Backlog sweep** — the same shipped work often closes a backlog item, and the
   two drift apart because nothing links them. After the changelog entry, skim
   `BACKLOG.md` for any open item (status not `shipped`/`done`/`closed`) this work
   now sufficiently covers and flip its tag to `shipped` **in the same commit**
   (leave the body; add a one-line "Shipped via …" note if it differs from the
   ask). See `docs/backlog.md`.
3. **Continue prompt** — after the commit + push, invoke `/continue-prompt` to
   refresh `continue.md` to the new HEAD. (It's a gitignored local handoff, so
   it's updated *alongside* the commit, not in it.)

Trivial commits (typo, dep bump, docs-only) skip all three.

## Commands

- `npm run build` — verify changes with this (do **not** run `npm run dev`; the user runs it)
- `npm run test` / `npm run lint`
- `npm run catalog:refresh` / `npm run pairings:build` — rebuild the static font catalog / pairing library

## Key files

| Area | File(s) |
|---|---|
| Fonts browser (root `/`: browse, search, filter, voice) | `app/components/BrowseView.tsx` |
| Specimen card | `app/components/FontSpecimenCard.tsx` (`DEFAULT_VOICE` now lives in `lib/specimen-samples.ts`, re-exported here) |
| Voice editor | `app/components/TypographicVoiceModal.tsx` |
| Pairings | `app/components/PairingsView.tsx` (per-font grid), `PairingCard.tsx`, `SuggestedPairings.tsx` (showcase) |
| Favorites | `app/components/FavoritesView.tsx`, `lib/favorites.ts` |
| Design-system primitives | `app/components/ui/*` (barrel `ui/index.ts`) |
| Per-card theming | `lib/card-themes.ts` (`PAGE_THEME`, `HIGHLIGHT`) |
| Font loading | `lib/font-loader.ts`, `lib/css2-url.ts` |
| Static data | `lib/catalog.ts`, `lib/pairing-library.ts`, `lib/specimen-samples.ts` |
| Fonts API | `app/api/fonts/route.ts` |
| **Agent surface** | `public/agent.md` (the contract), `app/compose/page.tsx`, `lib/compose-params.ts` (grammar), `lib/handoff.ts`, `lib/color.ts`, `lib/api-params.ts` |
| Routes / shell | `app/page.tsx` (Fonts, root), `app/pairings/page.tsx` + `app/pairings/[slug]/page.tsx` (SSG), `app/favorites/page.tsx`, `app/explorer/page.tsx` (→ `/`), `app/layout.tsx`, `app/components/GlobalNav.tsx` |
| URL slugs | `lib/slug.ts` (font-name ↔ slug, single source of truth) |
| Changelog | `content/changelog.json`, `app/changelog/page.tsx` |

## Feature docs — read when the topic comes up

Deep per-feature docs live in `docs/`. Don't pre-load them; when work touches one
of these areas, read the doc first (it carries the decisions and structure the
key-file map above doesn't).

| If we're working on… | Read |
|---|---|
| pairings (engine, routes, showcase, slugs) | `docs/pairings.md` |
| the backlog page (status tags, open/closed) | `docs/backlog.md` |
| font data / build scripts (catalog, libraries) | `docs/data-pipeline.md` |
| design system / theming | `docs/design-system.md` |
| the agent surface (`/compose`, the JSON APIs, `agent.md`) | `docs/plans/agent-surface-v1.md` + `public/agent.md` |

## Gotchas

- UI primitives carry no color — per-card themes flow through `className`/`style` (see `Card.tsx`). Reach for `app/components/ui` before hand-rolling.
- Every card surface renders one base `SpecimenCard` inside one `Grid`; vary via props/the `footer` slot, not new card shells.
- Overlays (e.g. the voice editor) share a pattern: fixed overlay, Escape + backdrop to close, body scroll lock — copy `TypographicVoiceModal.tsx`. Pairings are a route now, not an overlay.
- Favorites / voice persist to `localStorage`; hydrate after mount to avoid SSR mismatch (`readVoice` in `BrowseView.tsx`).
- `theme-light` class (`globals.css`) flips a self-contained surface to warm-cream light mode; the site itself stays dark.
- **`/compose` reads no viewer state.** It deliberately does *not* use `SpecimenCard`
  or `PAGE_THEME` — both resolve through `CardThemeProvider`/`VoiceProvider`, i.e.
  the viewer's localStorage. A composed URL must render identically for everyone it
  is sent to, so everything arrives as props. Keep it that way.
- Server components can't call into `"use client"` modules (exports become client
  references). That's why `fontStack` lives in `lib/font-stack.ts` and
  `DEFAULT_VOICE` in `lib/specimen-samples.ts`.
- Changing `/compose` params or behavior means updating `public/agent.md` in the
  same commit — that doc *is* the product surface for its primary user.

## Product direction

Focus is **browse + gather/favorite**. An earlier AI-generation / live-pairing
direction was parked — confirm before reviving parked scope.
