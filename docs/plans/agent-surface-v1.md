# Agent Surface V1

Turn Type Explorer from a site an agent can *read* into one an agent can *use* —
discover its capabilities unaided, query them, compose a curated page for its
user, and walk away with paste-ready implementation config.

The promise we're building toward, eventually stated on the home page:
**"Just tell your agent about this site. It will know what to do."**

That sentence is the spec. It's also falsifiable — see Acceptance.

> Reviewed adversarially with web research on 2026-07-18. Findings are folded in
> below; sources cited inline where a decision rests on one.

## The operating assumption

**Assume the least-capable agent.** The reader is in *some* agentic environment
and has exactly two abilities:

1. Fetch and read a web page.
2. Emit a URL as text, for the user to click.

No shell. No code execution. No filesystem. No browser automation. No screenshot
loop. It may be Claude Code, but it is just as likely a chat client with browsing,
helping a non-developer who heard the site is good for this.

Every decision below follows from that. The developer case is a superset and gets
better outcomes for free; it is never the baseline.

Two direct consequences:

- **No compression, no base64.** An agent with no code execution cannot compress,
  and models hand-encode base64 unreliably — best models hit ~76% perfect
  round-trip, with near-misses common, which is fatal for a URL payload
  ([Base64Bench](https://www.lesswrong.com/posts/5F6ncBfjh2Bxnm6CJ/base64bench-how-good-are-llms-at-base64-and-why-care-about)).
  Encoding is the weaker direction. The payload must be plain readable text a
  model can emit token by token and get right.
- **No self-verification by screenshot.** Which shifts the burden of visual
  quality off the agent and onto the site. See "Craft lives in the site."

## The flow we're enabling

1. User needs help with type, possibly color. Asks their agent.
2. Agent fetches the site, discovers the contract.
3. Agent queries fonts/pairings/palettes and reasons over them.
4. Agent composes several directions and hands the user a URL.
5. User reacts — agrees, disagrees, asks for something subtler.
6. Agent revises (a new URL), then leaves with everything needed to implement:
   imports, Tailwind config, CSS vars, weights, fallbacks.

## Baseline: what a cold agent found (2026-07-18)

Probed live with nothing but the domain, before any of this work:

- **Found**, by guessing Next.js conventions: `/api/fonts` returns 1,932
  families with `family, category, variants, axes, feelings, subsets,
  popularityRank, trendingRank, lastModified`. `category`, `limit`, `offset`,
  `sort=trending` all work.
- **Missing**: no `llms.txt`, no `robots.txt`, no `sitemap.xml`.
- **Misdiagnosed by the probe** (corrected on review): `feeling=elegant&category=serif`
  returned 348 — identical to `category=serif` alone, so the probe concluded the
  filter was broken. It isn't. `app/api/fonts/route.ts:62` implements it under the
  name **`tag`**, validated against the 20 known feelings and sorted
  strongest-first. `feeling` is simply an unknown param, and unknown params no-op.

  The real defect is therefore **discovery, not capability** — and the probe could
  not distinguish "feature absent" from "feature under a name I didn't guess."
  That is the single best argument for Phase 1 existing.

  Note the no-op is deliberate: the code comment says junk params no-op "rather
  than returning an empty grid," which is correct for the human UI where a stale
  URL shouldn't strand a user. So "400 on unknown params" is a real conflict
  between two consumers, not an obvious fix. See Phase 2.
- **Dead ends**: pairing pages carry rationale prose but zero specs. Palettes
  exist only as rendered HTML on `/colors`. Nothing is addressable-by-composition.

Net: an agent can retrieve and recommend, but cannot compose or hand off.

## Why this is tractable

Three seams already exist and are the reason V1 is plumbing, not architecture:

- `docs/design-system.md` — primitives are **color-agnostic by design**; color
  arrives via `className`/`style`. Agent-supplied hexes are the intended path.
- `lib/card-themes.ts` — `CARD_THEMES` is **11** hand-tuned, contrast-checked
  `{bg, fg, muted, accent}` palettes. (Verified by counting the array body; a
  naive `bg:` grep over the file returns 13-15 by also matching `PAGE_THEME`,
  `PAGE_THEME_DEFAULT`, `PAGE_CHROME_DEFAULTS`, and the interface.)
- `lib/css2-url.ts` — `pairingCss2Url()` already builds correct multi-family
  Google Fonts URLs, axes and italics included, behind tests.

## Core decision: readable query params, server-rendered

The composed page is addressed entirely by **plain query params**:

```
googlefontfinder.com/compose?pairs=gloock+inter,dm-sans+playfair-display
                            &mood=subtle
                            &for=long-form+documentation
```

Server-rendered, not client-hydrated from a fragment. That buys:

- **Fetch-back verification** (with a caveat — see below).
- Link previews when pasted into Slack, iMessage, a doc.
- No blank-page-on-JS-failure risk.
- Bookmarkable, shareable, stateless. No storage, no auth, no expiry.

Revision is free: the agent holds the previous params in context, mutates one,
emits a new URL.

### The URL budget — three tiers, and the smallest one binds

| Tier | Limit | Source |
|---|---|---|
| Vercel CDN hard limit | **14 KB**, 414 above it | [Vercel docs](https://vercel.com/docs/errors/URL_TOO_LONG) |
| General infra safe | ~8 KB | RFC 9110 recommends ≥8000 octets; CloudFront 8192B; nginx/Apache ~8K defaults |
| **Shareability (binding)** | **~2 K chars** | Slack breaks/splits URLs past ~4K — they *look* clickable and aren't; SMTP hard-wraps at 998-char lines |

**Target ~2K characters.** Shareability is a headline feature, so the constraint
that binds is the one nobody documents: a 6KB URL that 414s nowhere but shatters
when pasted into Slack still fails this plan's own promise. The three-card
overview must fit in ~2K. This is also the decisive argument for long-form
editorial being out of V1.

### Fetch-back verification is real but narrow

An agent can request its own composed URL and read the response — but that
confirms params **parsed**, not that fonts loaded or the page looks right (css2
loads client-side). So fetch-back only has value if the site *tells* it what
happened:

- **Degradation notes must live at a stable, machine-findable location** in the
  markup — a fixed-id element or comment block — including an explicit "no
  issues" signal when nothing was dropped.
- That location must be documented in the contract doc.

Without this, fetch-back is the agent re-reading its own input.

## Craft lives in the site, not the agent

The agent supplies **choices**; the site supplies **craft**. The agent picks
fonts, mood, and copy. The site owns every pixel of how that renders.

This is the load-bearing principle of V1. Because the agent usually cannot see
its output, it must not be the thing deciding visual outcomes. Which produces the
hard requirement:

> **No valid URL may produce an ugly page.**

Curated palettes, fixed templates, validated contrast, sensible defaults for
everything omitted.

### Graceful degradation

A non-developer's agent *will* emit slightly-malformed URLs. None of it may
blank-page. Drop the bad part, render the rest, and record what was ignored in
the machine-findable notes block.

Deliberate asymmetry with Phase 2: `/api/fonts` **surfaces** unknown params,
because a data query that silently lies is poison. `/compose` **never fails**,
because it is a rendering surface. Same instinct, opposite rule.

## Prior art

`/compose` is not a novel shape, which is reassuring — and the precedents carry
scars worth inheriting:

- **QuickChart.io** — chart-by-URL, explicitly used by LLM agents composing URLs.
  Hit URL-length pain, answered with POST + server-stored short URLs, which then
  brought expiry problems. Argues *for* our no-persistence stance.
- **Google Image Charts** (URL-composed, shut down 2019) — died partly on ~2K URL
  caps and unreadable URLs. Corroborates the 2K target.
- **Kroki / mermaid.ink** — use pako deflate + base64, and therefore *require a
  programmatic encoder*. Confirms the readable-params instinct.
- **Vercel OG** — documents this exact abuse pattern ("anyone can call `/api/og`
  with arbitrary params"), recommending [HMAC-signed params](https://vercel.com/docs/recipes/encrypting-parameters).
  We can't adopt signing — it contradicts open composition, which is the whole
  point — so we accept the tradeoff explicitly and mitigate cheaply instead
  (strict validation, clamps, long CDN caching).
- **shields.io** — a cautionary case in what an uncacheable unbounded-param render
  surface does to an origin.

## Phase 1 — Discovery

Goal: a cold agent learns the full contract in one fetch.

- [ ] **`public/llms.txt` — spec-conformant index, not a content dump.** The
      [spec](https://llmstxt.org/) defines an H1, a blockquote summary, and H2
      sections of markdown links; full content belongs in linked files. An earlier
      draft of this plan had llms.txt carrying the entire contract, which would
      have invented a parallel format.
- [ ] **`public/agent.md` — the full contract**, linked from llms.txt and served
      as plain markdown: query surface, all 11 palettes with hexes, the compose
      param grammar, the degradation-notes location, the handoff format, and one
      complete worked example (brief in, URL out).
- [ ] `public/robots.txt` and a `sitemap.xml` covering `/`, `/pairings`,
      `/pairings/[slug]`, `/colors`, `/changelog`. **`/compose` is deliberately
      excluded** — see Phase 3.
- [ ] A discoverability line in the home page markup that survives text
      extraction.

**Calibrate expectations on llms.txt.** An [Ahrefs study of 137K domains](https://ahrefs.com/blog/llmstxt-study/)
found 97% of published llms.txt files received zero requests, and Google's Mueller
compared it to the keywords meta tag ([SEJ](https://www.searchenginejournal.com/google-says-llms-txt-comparable-to-keywords-meta-tag/544804/)).
No AI provider has committed to consuming it. **But** the one demonstrated
consumer class is precisely our audience — coding and chat agents doing live
fetches, with Claude Code the top AI fetcher in that data. So ship it for this
use case; expect nothing from it as SEO.

## Phase 2 — Query surface

Goal: everything the agent needs to reason is queryable and honest.

- [ ] **Document `tag`** (the existing feelings filter) in the contract doc, and
      accept `feeling` as an alias. Add a score threshold.
- [ ] **Surface ignored params**: keep the deliberate no-op behavior for the human
      UI, but return an `ignored: ["feeling"]` array in the JSON response. Both
      consumers served, neither broken. This is the fix for the exact failure that
      produced this plan's own misdiagnosis.

      The prevailing REST convention is to ignore unknown params silently
      (GitHub's API does exactly this) — which is precisely what burned the cold
      probe. The `ignored` array is strictly better than both that convention and
      a blanket 400: honest *and* non-breaking. It only works if agents know to
      look, so **`agent.md` must state "check `ignored` in every response"** as
      part of the contract.
- [ ] Optional `?strict=1` → 400 on unknown params, for callers who want the
      loud version. Costs almost nothing.
- [ ] `/api/palettes` returning `CARD_THEMES` (+ `PAGE_THEME` defaults). Single
      source of truth stays `lib/card-themes.ts`.
- [ ] `/api/pairings` over `lib/pairing-library.ts`, filterable by font slug.

## Phase 3 — Compose

Goal: the agent can render a curated, on-brand page by writing a URL.

- [ ] `app/compose/page.tsx` — server-rendered from query params.
- [ ] `lib/compose-params.ts` — parse, validate, clamp, apply defaults, canonically
      order, and collect degradation notes. Pure and unit-tested; correctness lives
      here.
- [ ] One template for V1: `pairing-cards`, the N-up overview.
- [ ] `<meta name="robots" content="noindex">` — **not** a robots.txt `Disallow`,
      which would also block legitimate agent fetch-back. An unbounded
      parameterized route rendering arbitrary text is infinite crawl space and an
      SEO-spam vector.
- [ ] `Cache-Control: public, s-maxage=<long>, stale-while-revalidate`. **Vercel
      does not cache function responses by default** — the header is required, not
      an optimization ([CDN cache docs](https://vercel.com/docs/caching/cdn-cache)).
      Output is a pure function of the URL, so it's cacheable indefinitely. Cache
      is keyed on the full URL including query, so canonical param ordering in
      `lib/compose-params.ts` is what makes equivalent URLs share an entry.
- [ ] **Keep `/compose` cookie-free.** Responses carrying `set-cookie` are
      uncacheable, which would silently undo the above.

Abuse economics: an unsigned public render route can be hit at will, and Hobby
tier caps at 1M function invocations/month. Long CDN caching is the primary
defense (repeat hits never reach the function); Vercel WAF rate-limiting is the
fallback if it ever actually gets abused. Not worth pre-building.

### Param grammar (draft)

| Param | Form | Notes |
|---|---|---|
| `pairs` | `display+text,display+text` | font slugs per `lib/slug.ts`; **max 4** |
| `theme` | `3` \| `bg:212121,accent:E34712` | see Color below |
| `mood` | `subtle` \| `bold` \| `warm` \| `cool` | site picks from curated set |
| `for` | free text | optional page framing; ≤150 chars |
| `title` `subtitle` `paragraph` | free text | **optional** — populates `VoiceCopy`; blank fields fall back to `DEFAULT_VOICE` |
| `scale` `density` `contrast` `measure` | integers | bounded, defaulted |
| `h1` `h2` `p` | px integers | absolute overrides; clamped; beat `scale` |

Dials and overrides do different jobs. `scale` is one coarse knob that moves the
system in proportion — the right answer to "this feels too shouty." Overrides
answer "the header specifically is too big." Expect the coarse knob on the first
revision and overrides on the third.

Leading is **derived** from each size; the template owns rhythm. Overrides are
clamped, not trusted (`h1=800` becomes the max, with a note).

### Text is optional, and reuses `VoiceCopy`

**Do not invent a content model.** The site already has one: `VoiceCopy`
(`{ title, subtitle, paragraph }`) — a *user setting*, edited through
`TypographicVoiceModal`, persisted to localStorage. `FontSpecimenCard.tsx:66-72`
already implements per-field fallback: any blank field falls back to
`DEFAULT_VOICE`. Existing sample copy also lives in `lib/specimen-samples.ts`
(~40 / ~70 / ~220 chars for title / subtitle / paragraph).

So the compose params simply populate `VoiceCopy`, and the existing fallback does
the rest. One voice applies across the cards, matching how `BrowseView` works —
which also keeps the cost to ~330 characters rather than multiplying per card.

Consequences worth stating:

- **The minimal URL is `?pairs=gloock+inter,dm-sans+playfair-display`** and it
  renders beautifully, because the defaults are publishable editorial copy rather
  than lorem ipsum. Never burden the agent with supplying text.
- **The agent overrides only where it has genuine signal** about the user's
  project. Partial override is the expected case — a bespoke `title` over the
  default `paragraph` is normal, not a degraded state.
- **Relevance comes from selectivity, not volume.** A title naming the user's
  actual product does more than three paragraphs of typographic theory.
- **The user can already edit what the agent sent.** The voice modal exists and
  operates on exactly this shape — so "I like it but change the headline" is
  served by shipped UI, no new surface. If we later let that modal emit an
  updated URL, the user hands their edit straight back to the agent and the loop
  closes with almost no new code. Strong V2 candidate.

**Overflow truncates with a note; it does not error.** The never-fail rule holds:
the user still sees something good, and the degradation note tells the agent it
overran so the next URL is corrected. An error here would mean an over-eager
agent hands its user a broken link.

### Color: three ways in

The palette's coherence comes from its **role structure** (`bg`/`fg`/`muted`/
`accent`), not from specific values. So arbitrary hex is safe to allow — and it
unlocks the highest-value case: *"here are my brand colors, show me type that
works with them."* Curated indices cannot answer that.

| Form | Use |
|---|---|
| `theme=3` | curated index — safest, and the default |
| `mood=subtle` | intent; site picks from the curated set |
| `theme=bg:212121,accent:E34712` | bring-your-own, validated and completed |

Rules:

- **Named, not positional**, for the partial form.
- **Derive what's omitted.** Users know their background and brand accent; never
  their "muted." Derivation lives in `lib/card-themes.ts` so the arbitrary path
  routes *through* our taste rather than around it.
- **Whitelist before interpolation**: `/^[0-9a-fA-F]{3,8}$/`, enforced in
  `lib/compose-params.ts` before any value reaches a style attribute or CSS var.
  Font slugs resolve against the catalog — never interpolate a raw slug into a
  css2 URL; keep going through `lib/css2-url.ts` from `FontFamily` objects.
- **Per-role contrast validation.** [WCAG SC 1.4.3](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
  is 4.5:1 for normal text, 3:1 for large (≥24px regular / ≥18.66px bold). So:
  `fg`/`bg` ≥4.5:1; **`muted`/`bg` ≥4.5:1** (it renders at body sizes and is the
  classic derived-palette failure); `accent` ≥3:1 where used at display sizes.
  Nudge or fall back per role, not once globally.

### Content spoofing — the risk we're accepting

`for` and `note` put arbitrary text on your domain. React escaping kills XSS
(verified: no `dangerouslySetInnerHTML` anywhere in the repo), so this isn't a
compromise — it's your domain lending credibility to text you didn't write. Same
category as an open redirect.

Mitigations, all cheap:

- Hard length caps (200 chars) — a headline, not an essay.
- **Keep user text out of `<title>` and OG meta.** Use a fixed title
  ("Type direction — googlefontfinder.com"). Link previews are the spoofing
  payload, and they're exactly what gets rendered in Slack and iMessage.
- Reject URLs inside free text — that's the phishing tell.
- Keep the page visually legible as a *generated view*, not a published article.

## Phase 4 — Handoff

Goal: "that one" converts to working code with zero re-derivation.

- [ ] A specs block on every composed page — visible to the user, and readable by
      the agent on fetch-back.
- [ ] Contents: css2 `@import` and `<link>` forms, a Tailwind `fontFamily` +
      color-token snippet, plain CSS custom properties, exact weights and axis
      ranges, and full font stacks with fallbacks.
- [ ] Reuse `lib/css2-url.ts` — never hand-roll URL strings.

## Non-goals for V1

- **Long-form editorial pages.** The ~2K shareability budget settles this.
- Images. Type and color are the content.
- Server-side persistence, short links, accounts. QuickChart's short-URL detour
  into expiry management is the cautionary tale.
- Compression or opaque encodings.
- HMAC-signed params. Signing is the standard answer to this abuse surface and it
  contradicts open composition; we accept the tradeoff knowingly.
- An editing UI on the composed page. The loop is: user comments, agent revises.
- A typography doctrine / skill file. The taste is already encoded in
  `CARD_THEMES` and the templates.
- Reviving the parked AI-generation / live-pairing direction.
- Any change to the existing browse / pairings / favorites experience.

## MCP — a fast-follow, not a rejection

An earlier draft rejected MCP on the grounds that it "requires installation and
config, which a non-developer in a chat client can't do." **That rationale is
factually wrong.** Remote MCP over Streamable HTTP needs no local install — a
claude.ai user on any tier pastes one URL into Settings → Connectors, and authless
servers are supported ([Anthropic docs](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp)).
ChatGPT supports custom remote MCP too, tier-gated.

The conclusion survives on different grounds: **fetchable URLs reach every agent
with zero user action, and MCP still requires a deliberate configuration act most
non-developers never perform.** Auto-discovery (`.well-known` server cards,
SEP-2127) is in flight but not shipped end-to-end — no chat client discovers a
site's MCP server mid-conversation today.

So: URL params and the contract doc first, MCP as a cheap fast-follow that reuses
Phase 2's JSON endpoints verbatim. Worth doing, not worth blocking on.

## Acceptance

Run from a **fresh session with nothing but the domain, and no tools beyond
fetching pages and emitting text**:

1. Discover the contract without guessing at conventions.
2. Query fonts, palettes, and pairings; reason over feelings.
3. Compose three genuinely distinct directions as a single hand-written URL,
   **under 2K characters**.
4. Fetch that URL back and confirm from the degradation-notes block that it
   rendered as intended.
5. Deliver the link plus paste-ready config.

Secondary test — **the malformed-URL case**: corrupt a font slug and a hex, fetch
it, and confirm the page still renders, still looks intentional, and reports what
it dropped clearly enough for an agent to self-correct.

## Scope notes

- **One template, not five.** Templates do the work of making anything generated
  look intentional; one mediocre template poisons the promise.
- Phases 1–2 stand alone as a shippable unit — "the API got honest and
  discoverable."
- Everything else is plumbing against seams that already exist.

## Commit ritual reminder

Per `CLAUDE.md`: changelog entry in `content/changelog.json`, `BACKLOG.md` sweep,
then `/continue-prompt` after push.
