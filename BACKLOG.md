# Backlog

Lightweight idea tracker. Status tags: `idea` · `ready` · `in progress` · `parked`

---

## Learn: a typography one-pager `idea`

A single `/learn` page that covers everything someone needs to know about type to use the app well.

**Not** sub-routes. One scroll, editorial in tone — something a designer friend might hand you, not a feature demo or a tutorial.

**What it should accomplish:**
- Build immediate confidence for someone who knows nothing about type
- Cover the essentials: what the major classifications feel like, why pairings work, maybe a few letterform terms
- Feel worth reading on its own

**Thinking so far:**
- Lead with writing and real images rather than fully-coded interactive components — a well-chosen annotated diagram communicates faster than a canvas SVG
- Selective interactivity only: pop-ups or inline reveals where interaction adds something the static image can't
- "All you need to know about type" energy — the whole thing should feel crafted, not assembled

**Before building:**
- Review reference material and get clear on the handful of concepts that matter most
- Collect or sketch the images / diagrams that would anchor each section
- Draft the copy — the writing is the design here

**Prior attempt parked:** a more engineered version (sub-routes, canvas-measured anatomy, full classification grid) was built and reverted. The live font metrics idea had merit. Came back too early, before the content strategy was clear.

---

## Color palette system `idea`

Formalize and extend the existing card color palette (`CARD_THEMES` in `lib/card-themes.ts`) into a first-class system.

**What exists now:**
- 11 hand-curated `CardTheme` entries (bg / fg / muted / accent) cycling across all card surfaces
- A named source palette (`C`) of ~20 hex values the themes are built from
- `PAGE_THEME` for chrome and `HIGHLIGHT` for active controls — both fixed

**Direction:**
- Define the palette system more explicitly — named ramps, roles, relationships between colors
- Make it possible to add new themes without breaking the existing rotation
- Potentially expose controls for extending or customizing the palette

---

## Palette switcher UI `shipped`

UI elements for switching between color palettes — exact scope to be defined.

*(Note: this item was added mid-thought — finish describing what "switch between" means here before building.)*

**Shipped via the Colors page:** you can now select one card theme and apply it to
every card app-wide (Randomize / Use selected theme, on the Colors page and in the
gear), and recolor the page chrome with a live editor. That covers the practical
"switch between palettes" intent; reopen if a multi-preset switcher was meant.

---

## Local admin UI for curating suggested pairings `idea`

A local-only interface for managing `content/suggested-pairings.json` through the app rather than by hand-editing JSON.

**What exists now:**
- `content/suggested-pairings.json` is hand-maintained — the only way to add or remove a suggested pairing is to edit the file directly
- The home page renders whatever is in that file; a `HIDDEN_PAIRING_IDS` set in `app/page.tsx` is used to suppress specific entries without removing them

**Direction:**
- Local-only: gated behind an env flag or dev-only route (never ships as a public feature)
- Discovery flow: find a pairing naturally while using the app, then promote it to suggested pairings from the UI rather than switching to a code editor
- Management: reorder, hide, or remove existing suggested pairings from the same interface
- Agent handoff: the UI could accumulate a set of changes and generate a structured prompt describing them — so the actual JSON edit is handed to an agent rather than done by hand

**Open questions:**
- Gate mechanism: env var (`NEXT_PUBLIC_ADMIN=true`), a secret route (`/admin`), or a local-only config file?
- Whether changes write directly to the JSON file (requires a local API route) or are expressed as a prompt/diff for an agent to apply

---

## Split-panel pairing view `shipped`

**Shipped** as the per-font pairings route (`PairingsView.tsx`, `/pairings/{slug}`):
the selected font anchors a sticky left column as its own full specimen, partners
flow in their own grid to the right, no modal. Built as a route rather than an
in-grid transition (pairs naturally with the bookmarkable routes item) — so the
animated slide/stagger below didn't apply, but the interaction model shipped.

Rethink the "Get Pairings" interaction from a modal overlay into an inline split layout within the Explorer grid.

**What exists now:**
- A "Get Pairings" button on each `FontSpecimenCard` opens `SuggestedPairingsModal` — a full-screen overlay that replaces the grid entirely
- The original font card is no longer visible once the modal opens

**Direction:**
- Clicking a card selects it; the grid transitions to a split layout
- The selected font card anchors the left column, staying fully visible
- Remaining columns fill with its pairings — same card size, same grid rhythm
- No modal, no overlay — the font and its pairings coexist in one continuous view
- Closing/deselecting returns to the normal full grid

**Why this is better:**
- Keeps the original card in view so you never lose the reference point
- Feels native to the grid rather than interrupting it
- Related to the bookmarkable pairing routes idea — a selected card state maps naturally to a URL

**Transition:**
- The selected card slides/moves into the left column position, then the pairing cards appear in the remaining columns — motion communicates the parent-child relationship
- Pairings could fade or stagger in after the card settles

**Open questions:**
- Mobile: the split doesn't work at one column — probably falls back to a stacked layout (font card on top, pairings below)
- Relationship to the bookmarkable routes item: this is the interaction model; routing is the URL layer on top

---

## Mood/feeling-based font discovery `shipped`

**Shipped via a different mechanism than originally sketched.** Rather than a
mood dropdown in the search box (judged overwhelming — it'd be a giant tag-cloud),
discovery moved to the **card level**: every font card shows its top Google
`/Expressive` feeling tags as clickable pills, and clicking one focuses the Fonts
grid on that feeling (strongest-first) via a shareable `/?tag=cute` URL. Tags are
now baked into the catalog (`build-catalog.mjs` → `data/fonts.json`, 99% coverage).
The **semantic-search half** (typing "professional" matching tags in the search
box) was deliberately deferred — reopen if that's still wanted.

Make the Explorer search box useful for non-experts by surfacing Google Fonts' canonical mood/feeling tags — so someone can find a font by how it feels rather than by knowing its name.

**What exists now:**
- The search box does a substring match on font family name only — useless unless you already know what you're looking for
- The pairing engine already uses Google Fonts' `FAMILY_TAGS` (moods/feelings) internally to compute contrast distances, but that data is never exposed to the user
- Tags include things like: rugged, happy, stiff, professional, elegant, playful, etc.

**Two connected improvements:**

1. **Mood picker in the search dropdown** — clicking into the search box opens a dropdown of available mood tags. Clicking one filters the grid to fonts tagged with that feeling. No typing required — pure discovery for someone who doesn't know font names.

2. **Semantic search** — if someone types a mood word (or something adjacent to one), the search matches against tags and other metadata, not just the font name. Typing "professional" surfaces fonts tagged professional; typing "friendly" surfaces humanist faces even if "friendly" isn't an exact tag.

**Things to think through:**
- Where does the tag data live? `FAMILY_TAGS` is already used in the pairing scripts — check whether it's committed to the static catalog or only used at build time
- How many tags are there? May need grouping or a truncated "most useful" subset for the dropdown
- The dropdown and semantic search are independent — could ship one without the other

---

## Per-element visibility toggles in the gear `shipped`

In the gear menu (the global typographic voice editor, `TypographicVoiceModal`), add eyeball show/hide toggles for the three voice elements — **title, subtitle, paragraph** — so you can control which appear on cards globally.

- Eyeball icon per element (visible/hidden states).
- Constraint: at least one must stay visible — you can't hide all three; the last visible one's toggle is disabled (or hiding the second-to-last forces one to remain).
- This is a global setting, like the voice copy itself and the card-color preference — so it'd persist via the same localStorage-backed provider pattern (`VoiceProvider` / `CardThemeProvider`), and every card surface (`SpecimenCard`) reads it. `SpecimenCard` already conditionally renders `paragraph` (the Explorer specimen uses it, pairings don't), so the hooks for skipping an element exist; this generalizes that to user control over title/subtitle too.

**Decide when building:** whether the constraint is "disable the last visible toggle" vs "hiding all is a no-op," and whether hiding an element affects pairing cards (which already omit paragraph).

**Shipped:** constraint resolved as "disable the last visible toggle" (the toggle itself also refuses an all-hidden state). Visibility is global at the `SpecimenCard` level, so hiding title/subtitle affects pairing cards too — but the default only hides **paragraph** (off by default), which pairing cards never had, so they're unchanged out of the box. Persisted under `type-explorer:voice-visibility` in `VoiceProvider`.

---

## Adjustable size and weight on type cards `idea`

When inspecting a specific font or pairing, allow fine-tuning the size and weight of the heading, subheading, and body text — not globally, but scoped to that selection.

**Context:** most useful in the split-panel pairing view (see above) where you're evaluating a font seriously, not just browsing. The global typographic voice editor already handles copy; this is about the typographic properties — size and weight — for that one card.

**Low priority, unplanned. Things to think through:**
- Probably per-card controls, not a global setting — sliders or steppers for size and weight
- Should it persist per font, or reset when you move on?
- Relationship to the voice editor: the voice editor owns copy, this would own size/weight — keep them separate or merge?

---

## Pairing context previews `idea`

Once a pairing is selected, show it applied to a handful of real-world layout templates — so you can feel how the fonts behave in context, not just as a specimen card.

**Examples mentioned:**
- Social media card
- Business card
- Editorial layout
- Basic web page layout

**The idea:** these are static mock layouts, pre-built templates that swap in the active heading and body fonts. No design tool, no export — just enough to answer "does this pairing actually work for what I'm building?"

**This is unplanned — nothing decided yet. Things to think through:**
- Where does this live? Inline below the pairing card, a dedicated panel, or a new route?
- How many templates is useful without being overwhelming?
- Templates are static HTML/CSS — authored once, fonts injected at render time
- Relationship to the split-panel pairing view: context previews could be a natural extension of that layout

---

## Three-font pairings (spike) `idea`

Explore whether pairings should support a third font — typically a body/reading face distinct from both the display and the secondary text font.

**Current model:** every pairing is two fonts — a heading face and a body face.

**The question:** there are real design scenarios where three fonts make sense (display headline / UI sans / long-form serif body, for example). Is this worth supporting, and if so, how does it change the data model, the card, and the pairing logic?

**This is a spike — no direction yet. Things to think through:**
- Does the third font have a fixed role, or is it freeform?
- How does a three-font card look without getting busy?
- Does the pairing library need to grow to include trios, or is the third font always user-selected?
- At what point does "three fonts" become "just use the voice editor"?

---

## Bookmarkable pairing routes `shipped`

Replace the current pairings modal (opened via "Get Pairings" on a font card) with URL-routed pages so individual pairings can be bookmarked and shared.

**What exists now:**
- `SuggestedPairingsModal.tsx` opens as an overlay over the Explorer, triggered by a button on each `FontSpecimenCard`
- No URL change occurs — pairings are ephemeral, not linkable

**Direction:**
- Give each pairing a readable, bookmarkable URL (e.g. `/fonts/playfair-display` or `/pairings/playfair-display--lora`)
- Exact URL shape TBD — could be font-centric (one font's pairings) or pair-centric (a specific two-font combination)
- Modal UX may stay or be replaced by a dedicated page — decide when scoping
