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

## Palette switcher UI `idea`

UI elements for switching between color palettes — exact scope to be defined.

*(Note: this item was added mid-thought — finish describing what "switch between" means here before building.)*

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

## Split-panel pairing view `idea`

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

## Bookmarkable pairing routes `idea`

Replace the current pairings modal (opened via "Get Pairings" on a font card) with URL-routed pages so individual pairings can be bookmarked and shared.

**What exists now:**
- `SuggestedPairingsModal.tsx` opens as an overlay over the Explorer, triggered by a button on each `FontSpecimenCard`
- No URL change occurs — pairings are ephemeral, not linkable

**Direction:**
- Give each pairing a readable, bookmarkable URL (e.g. `/fonts/playfair-display` or `/pairings/playfair-display--lora`)
- Exact URL shape TBD — could be font-centric (one font's pairings) or pair-centric (a specific two-font combination)
- Modal UX may stay or be replaced by a dedicated page — decide when scoping
