---
name: type-specimen
description: >-
  Build a polished, interactive, self-contained HTML type specimen for a pairing
  of two Google Fonts (a display face and a text face), with light and dark mode
  and live, interactive type controls. Use when asked to generate a type specimen
  for a chosen pairing.
---

# Type Specimen

Produce a magazine-grade type specimen for **two Google Fonts** — a *display*
face (headlines, big text) and a *text* face (body, UI) — as a single
self-contained HTML file with light/dark mode and live, interactive controls.

This skill does NOT use a React build step. It edits one hand-written template:
copy `template.html`, fill its `{{PLACEHOLDER}}` slots, delete the blocks that do
not apply to this pairing, and write the result to the path the prompt gives you.

The prompt supplies everything you need — the two family names and their roles,
each family's real weights / italics / variable axes, a ready-built `css2` URL,
an optional brief, a palette mood, and the exact output path. **Do not research
the fonts, build your own URL, or re-derive the roles.** The injected metadata is
the source of truth.

## Workflow

1. **Read this file's `template.html` and `palettes.md`.**
2. **Pick a palette.** Match the supplied palette mood to the closest set in
   `palettes.md` (blend if it helps). Drop its `:root` and `.dark` token values
   into the template's token blocks. **Exception:** if the prompt supplies three
   fixed source colours (light/dark/accent), do NOT use `palettes.md` — set
   `--background`/`--foreground`/`--signal` from them and derive the rest, as the
   prompt describes.
3. **Set the fonts.** Replace the `{{CSS2_URL}}` with the URL from the prompt
   verbatim. Set `--font-display` and `--font-text` to the two family names.
   Fill every name/role placeholder.
4. **Match the axis playground to reality.** The DISPLAY font's real axes are in
   the prompt. Render exactly one slider per real variable axis (label, min, max,
   default from the metadata). If the display font is **static** (no axes),
   delete the entire axis-playground section and its nav entry. Never show a
   slider for an axis the font does not have — the text won't move, which is a bug.
5. **Optical-size demo** only if the display font has an `opsz` axis; otherwise
   delete that section and its nav entry.
6. **Write the brief-appropriate copy.** Headline, standfirst, body, sample words,
   and the colophon facts should fit the brief and the fonts. Do not reuse another
   pairing's copy verbatim.
7. **Write the finished single file** to the exact output path from the prompt.

## Guardrails

- Use ONLY the weights, italics, and axes listed in the prompt metadata. Never
  invent capabilities.
- Use the provided `css2` URL verbatim — axis ordering is already correct.
- Maintain AA contrast in both light and dark mode.
- Fill every placeholder; delete inapplicable optional blocks cleanly (no empty
  sections, no dangling nav links).
- **Self-containment:** one `.html` file. No external `src`/`href` except
  `fonts.googleapis.com` / `fonts.gstatic.com`. It must open correctly from
  `file://`.

## The specimen anatomy (keep all that apply, in order)

1. **Hero** — `Display × Text — Specimen`, both names set large in their faces,
   one-line pairing description.
2. **Colophon** — definition list: designers (if known), classification,
   styles/weights, variable axes, license (OFL/Apache), link to each family on
   fonts.google.com.
3. **Weight ladder (display)** — one row per real weight, a sample word each.
4. **Axis playground** — one slider per real display axis + italic toggle if
   available; live preview. *Variable display fonts only.*
5. **Optical-size demo** — same phrase at min vs max `opsz`. *`opsz` fonts only.*
6. **Live tester** — text input + size/weight controls, both faces at once.
7. **In context** — editorial spread: big headline (display), standfirst, drop
   cap, two-column body (text). The section that proves the pairing.
8. **Body specimen (text face)** — its own weight ladder, running text at body
   size, tabular figures, caps line.
9. **Glyph grid** — uppercase, lowercase, figures, punctuation (display face).
10. **Type scale** — modular ramp (~13px → 76px) of the display face.

## Reference files
- `template.html` — the known-good specimen to copy and fill.
- `palettes.md` — curated light/dark HSL token sets by mood.
