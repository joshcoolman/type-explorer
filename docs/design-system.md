# Design System

A small, structural foundation for type-explorer — rhythm, radius, a UI type
scale, one grid, and thin primitives. Adapted from the Material 3 numeric scales,
trimmed to what this app actually uses. The point is consistency and a confident
base to build on, not a framework.

**Color is deliberately out of this system.** Every primitive is color-agnostic.
Color still comes from where it already lives: the `--color-*` tokens in
`app/globals.css`, and the per-card dynamic `theme` palettes (the light-on-dark /
dark-on-light specimen cards). Primitives never set background/text/border *color*
— they own structure, so those color stories pass straight through untouched.

## Scales

### Spacing rhythm

Tailwind v4's default spacing is already a 4px scale, so we don't redefine it — we
**restrict** ourselves to an approved set and let primitives bake it in.

Approved steps: **4, 8, 12, 16, 24, 32, 48, 64 px** → Tailwind `1, 2, 3, 4, 6, 8, 12, 16`.
Avoid the in-between ad-hoc values (`p-5`, `py-2.5`, `gap-5`, `p-10`).

| Use | Value |
| --- | --- |
| Control padding (buttons/inputs) | `px-3 py-2` (sm controls `px-2.5 py-1`) |
| Card / panel padding | `p-4` (cards), `p-6` (panels) |
| Section padding | `py-12 sm:py-16` |
| Grid gap | `gap-4 lg:gap-6` |

### Radius (tokens in `globals.css` `@theme`)

| Token | Utility | px | Use |
| --- | --- | --- | --- |
| `--radius-control` | `rounded-control` | 8 | buttons, inputs, chips |
| `--radius-card` | `rounded-card` | 12 | cards, tiles, small panels |
| `--radius-surface` | `rounded-surface` | 16 | large pairing cards, modals, settings sheets |
| — | `rounded-full` | ∞ | pills, circular icon buttons |

### UI type roles (`app/components/ui/typeRoles.ts`)

Chrome typography only (Geist sans/mono). The **specimen** typography — the Google
Fonts on display — is content and stays dynamic; never route it through these.

| Role | Recipe | Use |
| --- | --- | --- |
| `display` | `text-4xl font-semibold leading-[1.05] sm:text-5xl` | page hero headings |
| `title` | `text-xl font-semibold leading-snug` | section / card headers |
| `body` | `text-sm leading-relaxed` | running UI copy |
| `label` | `font-mono text-[11px] uppercase tracking-[0.16em]` | eyebrows, footers, field labels |

`<Label>` renders the `label` role. For the others, apply `typeRole.display` etc.
to your element's `className`.

### Grid / breakpoints

Tailwind defaults (`sm` 640 / `lg` 1024 / `xl` 1280), loosely matching the M3
window classes. One card grid for the whole app via `<Grid>`:
`1 → 2 → 3 → 4` columns (or `2 → 3 → 4` with `dense`), `gap-4 lg:gap-6`.

## Primitives (`app/components/ui/`)

All are thin, structural, and spread native props + `className` + `style`. Pass
color in via token classes (`bg-panel`, `text-muted`, `focus:border-accent`) or
inline `style` (for the surfaces that drive color with inline palettes).

| Primitive | Purpose | Key props |
| --- | --- | --- |
| `Container` | page-width wrapper, responsive margins | — |
| `Grid` | the card grid | `dense` |
| `Stack` | vertical rhythm (flex col + gap) | `gap` (2/3/4/6/8) |
| `Button` | structural button | `size` (sm/md/icon-sm/icon), `shape` (control/pill) |
| `Input` / `Textarea` | structural field; export `fieldBase` | native field props |
| `Card` | structural card shell | `as`, `pad`, `radius` |
| `Panel` | larger surface (alias of Card: surface radius, lg pad) | same as Card |
| `Label` | the mono uppercase annotation role | `as` |

Import from the barrel: `import { Button, Grid, Card, Label } from "./ui";`

### `cn` helper (`lib/cn.ts`)

A minimal class joiner (filters falsy, joins). It does **not** resolve Tailwind
conflicts — so primitive base classes avoid properties callers override; use
`size` / `radius` / `shape` props for those, and `cn`/`className` only for
non-conflicting additions (color, layout, one-offs).

## Migrating a component

Worked examples already converted: `BrowseView.tsx` (Explorer), `SuggestedPairings.tsx` (Home).

To convert another component (e.g. `FontCard`, `SpecimenCard`, `GlobalNav`,
`SettingsPanel`, `GridView`, `FavoritesView`, `LibrarySidebar`):

1. Replace raw `<button>` → `<Button size=… className="<existing color classes>">`.
2. Replace raw `<input>/<textarea>` → `<Input>/<Textarea className="<color>">`.
3. Replace ad-hoc card/panel wrappers → `<Card>/<Panel>`; move color to `className`/`style`.
4. Replace `rounded`/`rounded-lg`/`rounded-xl`/`rounded-2xl` → `rounded-control`/`rounded-card`/`rounded-surface`.
5. Replace mono uppercase spans (`text-[11px] tracking-[0.1*em]`) → `<Label>`.
6. Replace bespoke card grids → `<Grid>` (add `dense` if it started at 2 columns).
7. Snap stray spacing to the rhythm (`p-5`→`p-6`, `gap-5`→`gap-4`/`gap-6`, `py-2.5`→`py-2`).
8. **Do not touch color** — keep existing token classes / inline `theme` styles as-is.
