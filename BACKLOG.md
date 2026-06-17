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

## Bookmarkable pairing routes `idea`

Replace the current pairings modal (opened via "Get Pairings" on a font card) with URL-routed pages so individual pairings can be bookmarked and shared.

**What exists now:**
- `SuggestedPairingsModal.tsx` opens as an overlay over the Explorer, triggered by a button on each `FontSpecimenCard`
- No URL change occurs — pairings are ephemeral, not linkable

**Direction:**
- Give each pairing a readable, bookmarkable URL (e.g. `/fonts/playfair-display` or `/pairings/playfair-display--lora`)
- Exact URL shape TBD — could be font-centric (one font's pairings) or pair-centric (a specific two-font combination)
- Modal UX may stay or be replaced by a dedicated page — decide when scoping
