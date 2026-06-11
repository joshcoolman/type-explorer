# Type Explorer

An agent-driven tool for discovering Google Fonts, getting pairing
recommendations from a plain-English brief, and generating polished,
self-contained HTML type specimens.

The core loop:

> describe a need or browse the catalog → an agent proposes font pairings → pick
> one → receive a magazine-grade, single-file specimen HTML you can open
> anywhere, share, or drop into another repo as design direction.

It is a **local-first personal tool** — run it with `npm run dev`, use your own
API keys, nothing is deployed or shared.

## What it does

1. **Browse** the full Google Fonts catalog with live previews, category
   filters, and popularity / trending / recently-updated sort.
2. **Brief** — type what you need ("something fun and playful for a kids game
   show") and get 2–4 pairings back, each with a rationale and a preview
   rendered in the actual fonts. Proposals are a single cheap structured-output
   call validated against the real catalog, so the model can't recommend a font
   that doesn't exist.
3. **Generate** a self-contained HTML specimen for a chosen pairing via a Claude
   agent running locally with a vendored skill. Progress streams live; finished
   specimens accumulate in a library and render in a sandboxed iframe.

A specimen is one `.html` file with ten sections (hero, colophon, weight ladder,
variable-axis playground, optical-size demo, live tester, an editorial spread,
body specimen, glyph grid, type scale), light/dark mode, and live interactive
controls. It opens correctly straight from `file://` — fonts load from Google's
CDN; nothing else is external. See
[`examples/fraunces-libre-franklin-specimen.html`](examples/fraunces-libre-franklin-specimen.html)
for a sample.

The repo also ships with four pre-built specimens under
[`seed/`](seed/). On first run — when your Library is still empty — the app
copies them into `data/` so you open to a populated Library without spending
anything (it's a plain file copy; the agent never runs for these). Your own
generations append alongside them.

## Setup

You need two API keys, both free to obtain:

| Key | What for | Where |
|---|---|---|
| `ANTHROPIC_API_KEY` | Pairing proposals + specimen generation (billed) | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| `GOOGLE_FONTS_API_KEY` | Fetching the font catalog (free, 10k req/day) | [Google Cloud console](https://console.cloud.google.com/apis/credentials) — enable the **Web Fonts Developer API**, then create an API key |

```bash
cp .env.example .env.local   # then paste your two keys
npm install
npm run dev                  # http://localhost:3000
```

The catalog is fetched once and cached to `data/fonts.json` for 7 days (a
"Refresh font catalog" button forces a refetch). All generated specimens and the
catalog live under `data/`, which is gitignored.

## Cost

- **Proposals** are a single Sonnet-class call — a fraction of a cent each.
- **Specimen generation** is an Opus-class agent run; expect roughly
  **$0.10–$0.40** per specimen depending on the pairing. The exact per-specimen
  cost is shown in the library (taken from the SDK's result message), and the app
  only runs the expensive step after you commit to a pairing.

## How it works

- **Next.js (App Router)** hosts the UI, the catalog API, the proposals call, and
  the specimen-generation jobs with SSE progress streaming.
- **Catalog layer** (`lib/catalog.ts`) is the ground truth: the Webfonts API
  (popularity + variable-axis data + trending ranks) merged and cached. Every
  read — browse, proposal validation, the generation prompt — goes through it, so
  the agent always works from real font metadata.
- **css2 URL construction** (`lib/css2-url.ts`) owns the fiddly axis-ordering
  rules and is unit-tested; the agent is handed a finished URL rather than
  building one.
- **Two-tier agents**: proposals use the plain Anthropic SDK with a forced
  tool-use schema; generation uses the Claude Agent SDK with a vendored
  `.claude/skills/type-specimen/` skill (a hand-written `template.html` the agent
  fills in — no build step).
- **Anti-hallucination**: the real weights, italics, and variable axes for both
  faces, plus the pre-built css2 URL, are injected into the generation prompt. The
  axis playground reflects the font's actual capabilities — no fake sliders.

## Scripts

```bash
npm run dev      # local dev server
npm run build    # production build
npm test         # unit tests (css2 URL construction)
npm run lint     # eslint
```

## Licensing

All Google Fonts in the catalog are under the SIL Open Font License or Apache
License. Specimens embed nothing — they reference the Google Fonts CDN — so
sharing a generated specimen is licensing-clean.
