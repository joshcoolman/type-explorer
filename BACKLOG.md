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

## Bookmarkable pairing routes `idea`

Replace the current pairings modal (opened via "Get Pairings" on a font card) with URL-routed pages so individual pairings can be bookmarked and shared.

**What exists now:**
- `SuggestedPairingsModal.tsx` opens as an overlay over the Explorer, triggered by a button on each `FontSpecimenCard`
- No URL change occurs — pairings are ephemeral, not linkable

**Direction:**
- Give each pairing a readable, bookmarkable URL (e.g. `/fonts/playfair-display` or `/pairings/playfair-display--lora`)
- Exact URL shape TBD — could be font-centric (one font's pairings) or pair-centric (a specific two-font combination)
- Modal UX may stay or be replaced by a dedicated page — decide when scoping
