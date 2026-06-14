# Continue

## Where we are

**type-explorer** (runs on **http://localhost:3001**; user runs the server, house
rule: never `npm run dev`). This session did a lot: a palette/theme system, a
lightweight card grid, an emoji guard, a Brief log fix, and — the big one — a
**complete rewrite of tier-2 specimen generation** plus a **radically leaner
specimen**. All green: `npm run build` clean, `npm run lint` clean, `npm test`
**29 passing** (10 css2-url + 9 palette + 10 specimen-render). Everything verified
live in the browser.

## The big change this session: generation + lean specimen

Old: the Agent SDK (opus) rewrote the entire ~515-line `template.html` every time
(~$0.5, ~100s). New: **code renders the scaffold from the catalog; one tiny Sonnet
call returns just the copy.** And the specimen itself was cut down hard.

**Lean specimen (the only sections now):**
- Header bar: just the `Display × Text` title in a **monospace** stack (var
  `--font-mono`, NOT either specimen face) + the light/dark toggle. **No nav.**
- **1. In context** (now the first section) — editorial spread, drop cap.
- **2. Type scale** — **interactive**: Display/Text tabs + a weight button per real
  weight; clicking a weight reflows the whole ramp. Driven by injected
  `window.__scaleData = {display:{name,weights}, text:{name,weights}}`.
- **Cut entirely:** Hero, Colophon, Weight ladder, Axis playground, Optical size,
  Live tester, Body specimen, **Glyph grid**.

**New generation pipeline:**
- `lib/specimen-render.ts` (NEW, pure, **unit-tested** `lib/specimen-render.test.ts`)
  — `renderSpecimen({display,text,copy,palette})`. Reads `template.html` (module
  cached), computes each face's weight list (`weightList`: static → `parseVariants`
  upright weights; variable → 100–900 steps ∩ wght axis range), builds css2 URL via
  `pairingCss2Url`, bakes palette via `derivePaletteCss` into a `<style
  id="palette-baked">`, substitutes `{{…}}` tokens. Escapes HTML in copy and JS in
  `scaleWord`.
- `lib/specimen-copy.ts` (NEW) — `getSpecimenCopy({display,text,brief})`, a plain
  `@anthropic-ai/sdk` forced-tool Sonnet call (mirrors `lib/propose.ts`) returning
  `SpecimenCopy { contextHeadline, contextStandfirst, contextBody[], scaleWord }`.
  Emoji/symbol-banned. **Never throws** — `fallbackCopy(display,text)` gives generic
  lorem on any failure (so a $0 path exists).
- `lib/generate.ts` — `runGeneration` rewritten: `findFamily → getSpecimenCopy →
  renderSpecimen → writeFile`. **Agent SDK dropped.** Removed `appRoot` from
  `GenerateOptions` (and from the `lib/jobs.ts` call). `paletteMood` kept on the
  interface but unused.
- `lib/types.ts` — added `SpecimenCopy`.
- `SKILL.md`/`palettes.md` are now **reference-only** (generation no longer reads
  them or loads the skill).

**GOTCHA fixed this session:** never put a `{{PLACEHOLDER}}` inside the `<style>`
block's CSS comments — substituting a value containing `</style>` there prematurely
closes the stylesheet. There's a render test guarding `<style>`/`</style>` balance.

## Other changes this session (all also done)

- **Palette/theme system** (earlier in session): `lib/palette.ts` (+test) — `Palette`
  type (re-exported from types), `DEFAULT_PALETTE`, localStorage CRUD (key
  `type-explorer:palette`), `hexToHsl`/`deriveTokens`/`derivePaletteCss`/
  `swatchColors`. `lib/specimen-control.ts` — `SpecimenControl`, `specimenSrc`,
  `postControl`, `useSpecimenControl`. Specimens are sandboxed iframes driven by
  `?theme=`/`?pal=` URL params (first paint) + `postMessage` (live). `SettingsPanel`
  (3 color pickers + swatch preview), `mode/palette/paletteEnabled/gridMode` state in
  `app/explorer.tsx`, header grid + settings icons. Default mode **light**, custom
  palette **ON**.
- **Card grid is lightweight** (`app/components/SpecimenCard.tsx`): NO iframe — a
  display-font headline + lorem paragraph colored from `swatchColors(palette,mode)`;
  body uses `c.mutedForeground` (NOT `c.muted`, which is a near-background fill — that
  was a contrast bug, fixed). `GridView.tsx` keeps the Display/Text… no, keeps the
  light/dark `ModeToggle` + expand-to-full-`SpecimenViewer`.
- **Emoji guard** in `lib/propose.ts` (proposal copy) and `lib/specimen-copy.ts`.
- **Brief log fix** (`BriefView.tsx`): `generate()` sets `autoFocused.current = true`
  so starting the first job in an empty library no longer auto-opens the log; it just
  flips the card to "View progress".

## Library / data state

`data/` was reset and re-seeded with the **4 re-rendered lean seeds**
(`seed/specimens/*.html`, regenerated via the new renderer with per-pairing palettes
+ canned copy, $0). `data/index.json` + the 4 slug-named HTML files are present and
served. `seedIfEmpty` (`lib/store.ts`) re-copies seeds only when `data/index.json` is
absent (cached per process → needs a server restart to re-trigger; not needed now
since data is populated).

## Outstanding / next steps

- **Restart the dev server** when convenient so it loads the new `generate.ts` for new
  generations (in-memory job registry + seedChecked persist across HMR).
- The **copy call** (`getSpecimenCopy`) wasn't exercised live yet — generate one from
  Brief to confirm the Sonnet copy looks good (render half is fully verified via the
  seeds).
- `costUsd` is no longer reported for generations (Sonnet call cost not computed) —
  fine, UI tolerates undefined; add token→USD estimate later if wanted.
- Stray untracked `pnpm-lock.yaml` may still want deleting (project uses npm).
- **Nothing committed** — all work sits uncommitted on `2e3d7f9`.

## Git state

Branch `main`, last commit `2e3d7f9 initial commit`, no remote. Modified: SKILL.md,
template.html, app/api/jobs/route.ts, BriefView/LibraryView/SpecimenViewer/explorer,
lib/{generate,jobs,propose,types}.ts, the 4 seed HTMLs. New (untracked):
GridView/SettingsPanel/SpecimenCard.tsx, lib/{palette,palette.test,specimen-control,
specimen-copy,specimen-render,specimen-render.test}.ts. All uncommitted.

Last files edited: `.claude/skills/type-specimen/template.html`,
`lib/specimen-render.ts`, `lib/specimen-copy.ts`, `lib/generate.ts`,
`seed/specimens/*.html`.
