# Type Explorer — Specification

An agent-driven tool for discovering Google Fonts, getting pairing recommendations from a natural-language brief, and generating self-contained HTML type specimens.

The core loop: **describe a need or browse the catalog → the agent proposes font pairings → pick one → receive a polished, single-file specimen HTML you can open anywhere, share, or drop into another repo as design direction.**

This spec is the seed document for the repo. It is written so a coding agent can implement the app phase by phase. Two existing assets inform the design and should be treated as reference implementations:

- `~/repos/repo-explorer` — a local Next.js app where a Claude Agent SDK subagent produces self-contained HTML reports. Its job queue, SSE streaming, file storage, and skill-vendoring patterns are reused here nearly verbatim.
- `~/repos/type-spec` — a Claude Desktop skill (`type-specimen.skill`) and two example specimens (`bricolage-hanken-specimen.html`, `fraunces-libre-franklin-specimen.html`) that define the specimen format this app must produce.

---

## 1. Overview

Type Explorer is a local-first personal tool (run with `npm run dev`, no deployment) intended to live in a public GitHub repo that others can clone and run with their own API keys.

Three things it does:

1. **Browse** the full Google Fonts catalog with live previews, category filters, and popularity/trending sort — the discoverability piece.
2. **Propose** 2–4 font pairings from a plain-English brief ("something fun and playful for a kids game show"), each with a rationale and a live preview rendered in the actual fonts.
3. **Generate** a magazine-grade, self-contained HTML type specimen for a chosen pairing, via a Claude agent running locally with a vendored skill. Progress streams live; finished specimens accumulate in a library.

## 2. Goals and non-goals

**Goals**

- Pragmatic and minimal: file-based storage, no database, no auth, one-command startup.
- Specimens are single self-contained `.html` files — portable, viewable offline (fonts load from Google's CDN), suitable for handing to another agent as design direction.
- The agent never invents font capabilities: axis sliders, weights, and italics in a specimen must reflect real catalog metadata.
- Cheap iteration: proposals cost a fraction of a cent; the expensive agent run happens only after the user commits to a pairing.
- Public-repo quality: clear README, `.env.example`, gitignored data, cost transparency.

**Non-goals (v1)**

- Deployment/hosting, multi-user, auth.
- Self-hosting font files (css2 CDN is fine; all fonts are OFL/Apache so embedding is licensing-clean).
- Single-font specimens (future extension; v1 is pairings only, matching the existing skill).
- Free-form chat with the agent (future extension; v1 is the structured brief → options → pick flow).
- Editing/regenerating an existing specimen in place.

## 3. Tech stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) | Mirrors repo-explorer; API routes host the Agent SDK and SSE streams |
| Language | TypeScript, strict | |
| Styling (app UI) | Tailwind CSS 4 | Specimen HTML uses its own embedded CSS, not Tailwind |
| Agent runtime | `@anthropic-ai/claude-agent-sdk` | Same major version as repo-explorer; runs locally against `ANTHROPIC_API_KEY` |
| Proposals LLM call | `@anthropic-ai/sdk` (plain API) | Structured output via tool use; no agent loop needed |
| Storage | Filesystem (`data/`) | JSON manifest + HTML files, identical shape to repo-explorer |
| HTML parsing | none needed | (repo-explorer needed cheerio for scraping; this app gets structured data from the Webfonts API) |

**Required config** (copy from `repo-explorer/next.config.ts`):

```ts
serverExternalPackages: ["@anthropic-ai/claude-agent-sdk"]
```

This keeps the SDK's bundled CLI out of the server bundle so it resolves from `node_modules` at runtime.

**Environment** (`.env.local`, with a committed `.env.example`):

```
ANTHROPIC_API_KEY=sk-ant-...        # billing for proposals + specimen generation
GOOGLE_FONTS_API_KEY=AIza...        # free key, Webfonts Developer API, 10k req/day
```

## 4. Font catalog layer

The catalog is the app's ground truth and the guardrail that keeps the agent honest.

**Source: Google Fonts Developer API (Webfonts API)**

```
GET https://www.googleapis.com/webfonts/v1/webfonts?key=KEY&sort=popularity
```

- Free API key, 10,000 requests/day — far more than needed since we cache.
- Returns per family: name, category (`serif`, `sans-serif`, `display`, `monospace`, `handwriting`), variants (weights + italics), subsets, version, last-modified, file URLs.
- `capability=VF` variant of the query returns variable-font axis definitions (tag, min, max, default) — fetch both and merge so each family record carries its real axes.
- Supported sorts: `popularity`, `trending`, `date`, `alpha`. Popularity and trending answer the "is there a trend?" discoverability question directly.

**Caching (`lib/catalog.ts`)**

- On first request (or when stale), fetch the API, merge the VF axis data, and write `data/fonts.json` with a `fetchedAt` timestamp.
- TTL: 7 days. A manual "refresh catalog" action in the UI forces a refetch.
- All reads in the app — browse UI, proposal validation, specimen prompt construction — go through this cached catalog. The Google API is hit at most a couple of times a week.

**Catalog record shape (`lib/types.ts`)**

```ts
interface FontFamily {
  family: string;            // "Bricolage Grotesque"
  category: "serif" | "sans-serif" | "display" | "monospace" | "handwriting";
  variants: string[];        // ["200", "300", ..., "800italic"]
  axes?: { tag: string; min: number; max: number; defaultValue: number }[];
  subsets: string[];
  popularityRank: number;    // index in the popularity-sorted response
  trendingRank?: number;     // index in the trending-sorted response
  lastModified: string;
}
```

**Font loading in the browser (no key needed)**

```
https://fonts.googleapis.com/css2?family=Family+Name:wght@400;700&display=swap
```

A small client helper (`lib/font-loader.ts`) injects `<link>` tags on demand and dedupes already-loaded families. Browse-grid previews load only a 400 weight with `text=` subsetting where helpful to keep requests light; proposal previews and the specimen load full ranges.

**css2 URL construction rules** (these trip people up; encode them in one tested utility, `lib/css2-url.ts`):

- Axis list is alphabetical with lowercase tags before uppercase: `ital,opsz,wght` then `SOFT,WONK`.
- Tuple values must match the axis order exactly: `Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,100..900,0..100,0..1;1,...`
- Ranges use `..`; discrete values use `;`-separated tuples.
- Spaces in family names become `+`.

## 5. UI

Single-page app in the spirit of `repo-explorer/app/explorer.tsx`: a left sidebar (library) and a main panel that switches between three views via tabs. Dark, editorial aesthetic consistent with the specimens. No emojis anywhere in the UI.

### 5.1 Browse (discoverability)

- Search box (substring match on family name), category filter chips, sort selector (popularity / trending / recently updated / A–Z).
- Grid of font cards. Each card renders its family name and a short sample line **in the actual font** (loaded lazily via css2 as cards scroll into view — IntersectionObserver, weight 400 only).
- Card metadata: category, weight count, variable-axis tags if any, popularity/trending rank.
- Selection model: click to select up to two fonts. With two selected, a "Generate specimen" action appears (user assigns display vs text roles, or accepts the app's guess: the more characterful/display-category font is display). With one selected, a "Find a partner" action sends that font into the Brief flow as a constraint.

### 5.2 Brief (agent proposals)

- A single textarea: "Describe what you need." Placeholder example: *"Fun and playful for a kids game show. Needs to work for big headlines and readable instructions."*
- Optional constraint chip if arriving from Browse with a locked font ("must include Gasoek One as display").
- Submit calls `POST /api/proposals` (see section 6.1). Response renders as 2–4 **proposal cards**, each showing:
  - Display font name set huge in the display font; text font name and a two-sentence body sample set in the text font (live css2 rendering — zero generation cost to preview).
  - The agent's rationale (2–3 sentences: why this pairing fits the brief).
  - A suggested palette mood word (feeds the specimen's palette choice).
- Actions per card: **Generate specimen** (starts the job) or dismiss. A "more options" button re-runs proposals excluding already-shown pairings.

### 5.3 Library

- Sidebar list of all specimens from `data/index.json`, newest first: title ("Bricolage Grotesque × Hanken Grotesk"), status badge (running / done / error), cost and duration tags. Identical pattern to repo-explorer's report list.
- Selecting a running job shows the **live progress panel**: streamed status headlines, agent narration, tool calls, elapsed time — the same SSE event rendering as `repo-explorer/app/explorer.tsx`.
- Selecting a finished specimen renders it in a sandboxed iframe:

  ```html
  <iframe src="/api/specimens/{id}" sandbox="allow-scripts allow-popups" />
  ```

  Note one deliberate difference from repo-explorer: specimens need `allow-scripts` because axis sliders, the live tester, and the theme toggle are interactive. Reports there were static; specimens are not. The iframe still has no `allow-same-origin`, so scripts run in an opaque origin.
- Per-specimen actions: open raw HTML in a new tab, reveal file in Finder (it's just `data/specimens/<id>.html`), delete.

## 6. Agent integration — two tiers

The expensive/cheap split is the core pragmatic decision: proposals are a single structured-output API call; only a confirmed pairing triggers the full agent job.

### 6.1 Tier 1: Pairing proposals (plain Anthropic SDK)

`POST /api/proposals` with `{ brief: string, lockedFont?: string, exclude?: string[][] }`.

Implementation (`lib/propose.ts`):

1. Build a compact catalog digest to ground the model: the top ~250 families by popularity plus all families matching the brief's likely categories, as `family (category, weights, axes)` lines. This keeps the prompt a few thousand tokens while covering virtually any sensible recommendation.
2. One `messages.create` call (Sonnet-class model is plenty) with a forced tool-use schema:

   ```ts
   interface PairingProposal {
     display: string;        // exact family name
     text: string;
     rationale: string;
     paletteMood: string;    // e.g. "warm editorial", "cool ink", "playful citrus"
     sampleHeadline: string; // brief-appropriate sample copy for the preview card
     sampleBody: string;
   }
   // tool input: { proposals: PairingProposal[] }  (2–4 items)
   ```

3. Validate every returned family name against the cached catalog (exact match after normalization). Drop proposals with unknown families; if fewer than 2 survive, retry once with the failures named in the prompt. This is cheap insurance against hallucinated fonts.
4. Return validated proposals. The client renders previews itself via css2 — no images, no further API calls.

### 6.2 Tier 2: Specimen generation (Claude Agent SDK + vendored skill)

`POST /api/jobs` with `{ display: string, text: string, brief?: string, paletteMood?: string }` creates a `SpecimenMeta`, enqueues a job, and returns immediately — exactly the `repo-explorer/app/api/jobs/route.ts` flow.

The job (`lib/generate.ts`, modeled line-for-line on `repo-explorer/lib/analyze.ts`):

```ts
query({
  prompt: buildPrompt(opts),         // see below
  options: {
    model: <current Opus-class model>,
    cwd: appRoot,                    // so .claude/skills/ resolves
    settingSources: ["project"],
    permissionMode: "bypassPermissions",
    includePartialMessages: true,    // stream thinking + text deltas
  },
})
```

`buildPrompt` directs the agent to use the `type-specimen` skill and injects everything it needs so it never has to guess or browse:

- Display and text family names and roles.
- **Full catalog metadata for both families**: exact weights, italic availability, every variable axis with min/max/default. This is the enforcement mechanism for the existing skill's #1 guardrail ("axis playground must reflect actual font capabilities — no fake sliders") — the data is in the prompt, not left to the model's memory.
- The pre-built css2 URL for the pairing (constructed by `lib/css2-url.ts`, not by the model — axis-ordering rules are too easy to get wrong).
- The user's brief and palette mood, to steer copy and palette selection.
- The absolute output path: `data/specimens/<id>.html`.

Progress events (token deltas, tool calls, completion with cost) stream through the same in-process job registry and SSE route as repo-explorer (`lib/jobs.ts`, `app/api/jobs/[id]/events/route.ts` — copy both, they are domain-agnostic).

### 6.3 The vendored skill: `.claude/skills/type-specimen/`

Adapted from `~/repos/type-spec/type-specimen.skill`, with one significant pragmatic change: **no web-artifacts-builder, no React build step**. The Claude Desktop skill scaffolded a React/Tailwind project and bundled it; here, the skill follows the `repo-explorer/.claude/skills/explore-repo/` pattern instead — a static template plus instructions:

```
.claude/skills/type-specimen/
├── SKILL.md            # workflow, guardrails, section-by-section content guidance
├── template.html       # complete working specimen with placeholder slots
└── palettes.md         # the 7 light/dark token sets from the original skill, plus guidance for deriving new ones
```

**`template.html`** is a full, working specimen (port the structure of `fraunces-libre-franklin-specimen.html` to hand-written HTML/CSS/vanilla JS, unminified). It contains:

- All ten sections (section 7) with `{{PLACEHOLDER}}` slots for names, copy, colophon facts, sample words, and palette tokens.
- ~150 lines of vanilla JS for the interactive parts: theme toggle, axis sliders driving `font-variation-settings`, the live tester input, glyph-grid hover. No framework, no build.
- A clearly marked "axis playground" block the agent duplicates per real axis and deletes entirely for non-variable fonts (the original skill's fallback guidance).

**`SKILL.md`** carries over the original skill's workflow and guardrails, restated for this context:

1. Roles are given (display vs text) — do not re-derive them.
2. Use only the weights/axes/italics provided in the prompt metadata. Never invent capabilities.
3. Use the provided css2 URL verbatim.
4. Choose a palette from `palettes.md` matching the supplied mood; adapt sample words and headline copy to the brief — never recolor-and-reuse another pairing's copy.
5. Maintain AA contrast in both light and dark modes.
6. Fill every placeholder; delete inapplicable optional blocks (axis playground, optical-size demo) cleanly.
7. Write the finished single file to the provided output path. Self-containment check: no `src`/`href` except `fonts.googleapis.com` / `fonts.gstatic.com`.

Why this is better than the React-build approach for this app: generation is faster and cheaper (the agent edits one file instead of scaffolding a project), failure modes are fewer (no bundler), and the output is still byte-for-byte the same kind of artifact — one portable HTML file.

## 7. Specimen format contract

The anatomy below is extracted from the two reference specimens and is the contract `template.html` and the skill must satisfy. A generated specimen contains, in order, with a sticky header (numbered section nav + theme toggle):

1. **Hero** — pairing title (`Display × Text — Specimen`), both names set large in their own faces, one-line pairing description.
2. **Colophon** — definition list: designers, classification, styles/weights, variable axes, license, link to each family on fonts.google.com.
3. **Weight ladder (display)** — one row per real weight, brief-appropriate sample word.
4. **Axis playground** — only if the display font is variable: one slider per real axis (label, min/max from metadata), italic toggle if available, live preview line. Omitted entirely otherwise.
5. **Optical size demo** — only if the display font has `opsz`: same phrase at min and max optical size, side by side.
6. **Live tester** — text input plus size/weight controls, rendered simultaneously in both faces.
7. **In context** — editorial spread: large headline (display), standfirst, drop cap, two-column body (text face). This is the section that proves the pairing.
8. **Body specimen (text face)** — its own weight ladder, a running-text block at body size, tabular figures, caps/small-caps line.
9. **Glyph grid** — uppercase, lowercase, figures, punctuation for the display face.
10. **Type scale** — modular ramp (roughly 13px → 76px) showing the display face across sizes.

**Token system** (carried over exactly from the reference specimens):

- HSL channel values, no `hsl()` wrapper: `--background: 42 38% 97%;` consumed as `hsl(var(--background))`.
- Semantic names: `--background`, `--foreground`, `--card`, `--muted`, `--muted-foreground`, `--border`, `--accent`, `--signal` (the accent), `--ring`, `--radius`.
- Light tokens on `:root`, dark overrides on `.dark`; toggle persists via `localStorage`.
- Crisp editorial styling: `--radius: 0.25rem`, uppercase letter-spaced labels, `tnum` for tabular figures, `::selection` in the signal color.

**Self-containment rule**: one `.html` file, no external assets except Google Fonts CDN requests. The file must open correctly from `file://`.

## 8. Jobs, streaming, and storage

Copied shapes from repo-explorer — these modules are domain-agnostic and should be ported with minimal renaming:

- `lib/jobs.ts` — in-process job registry and queue (max 2 concurrent is plenty here), event buffering for late SSE subscribers, cleanup grace period.
- `lib/store.ts` — manifest upserts and HTML persistence.
- `lib/format.ts` — duration and USD formatting.

```
data/                          # gitignored
├── fonts.json                 # cached catalog + fetchedAt
├── index.json                 # SpecimenMeta[]
└── specimens/
    └── <id>.html
```

```ts
interface SpecimenMeta {
  id: string;                  // uuid
  title: string;               // "Fraunces × Libre Franklin"
  display: string;
  text: string;
  brief?: string;
  createdAt: string;
  status: "running" | "done" | "error";
  costUsd?: number;
  durationMs?: number;
  error?: string;
}
```

After a job completes, `lib/jobs.ts` injects a small metadata footer comment into the HTML (generated date, cost, generator name + repo URL) before final save — the repo-explorer post-processing pattern.

## 9. API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/fonts` | GET | Cached catalog; query params: `q`, `category`, `sort`, `limit`, `offset` |
| `/api/fonts/refresh` | POST | Force catalog refetch |
| `/api/proposals` | POST | Brief → validated pairing proposals (tier 1) |
| `/api/jobs` | POST | Start specimen generation (tier 2); returns `SpecimenMeta` |
| `/api/jobs/[id]/events` | GET | SSE stream of progress events |
| `/api/specimens` | GET | `SpecimenMeta[]` from `data/index.json` |
| `/api/specimens/[id]` | GET | Serve specimen HTML (`text/html`) |
| `/api/specimens/[id]` | DELETE | Remove specimen + manifest entry |

## 10. Public-repo considerations

- README covers: what it is (with a screenshot and a sample specimen GIF), the two free API keys and exactly where to get them (Anthropic console; Google Cloud console with the Webfonts Developer API enabled), `cp .env.example .env.local`, `npm install`, `npm run dev`.
- `data/` is gitignored; commit one example specimen under `examples/` so visitors can see the output without spending anything.
- Cost transparency: per-specimen USD shown in the library (from the SDK's result message); README states a typical per-specimen cost range so users know what to expect.
- Licensing note in the README: all Google Fonts are OFL/Apache; specimens embed nothing, they reference the Google CDN.
- House style: no emojis anywhere (code, README, UI).

## 11. Build order

Each phase is independently verifiable; finish with a production build (`npm run build`) per house rules.

1. **Scaffold + catalog + Browse.** Next.js app, `lib/catalog.ts`, `lib/css2-url.ts` (with 2–3 unit tests — the axis-ordering rules are the one genuinely fiddly pure function in the app), `/api/fonts`, Browse view with live previews. Verifiable: browse, search, filter, sort real fonts.
2. **Proposals.** `lib/propose.ts`, `/api/proposals`, Brief view with proposal cards and live previews, catalog validation + retry. Verifiable: type a brief, get plausible pairings rendered in real fonts.
3. **Generation.** Port `lib/jobs.ts` / `lib/store.ts` / SSE route from repo-explorer; write the skill (`SKILL.md`, `template.html`, `palettes.md`); `lib/generate.ts`; progress panel; iframe viewer. Verifiable: end-to-end brief → specimen, and the saved HTML opens standalone from `file://` with working sliders and theme toggle.
4. **Library polish + public-repo pass.** Delete/open-file actions, catalog refresh button, README, `.env.example`, example specimen, gitignore audit.

## 12. Future extensions

- Single-font specimens (template variant without the pairing sections).
- Chat refinement on proposals ("warmer", "less quirky", "swap the text face").
- Trending panel: surface `sort=trending` movers as a browsing entry point, analogous to repo-explorer's GitHub trending view.
- Favorites/collections of fonts and pairings.
- Regenerate-with-tweaks: reuse a finished specimen's pairing with a different palette or brief.
- "Hand to agent" affordance: copy a prompt snippet that tells a coding agent to adopt the specimen as a project's type system.
