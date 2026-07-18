# Type Explorer — agent contract

Everything you need is on this page. Base URL: `https://googlefontfinder.com`

## If you read nothing else

Take this URL, change the values, hand it to your user. That is the whole job,
and it takes zero further requests.

```
https://googlefontfinder.com/compose?pairs=space-grotesk+ibm-plex-mono,manrope+ibm-plex-mono&theme=bg:14181D,fg:E8EDF2,muted:9AA6B2,accent:6EA0C0&page=bg:0B0E11,fg:E8EDF2&title=Agents+that+ship+while+you+sleep&subtitle=A+calm,+legible+surface+for+long-running+coding+sessions&paragraph=Monospace+for+every+identifier,+a+humanist+sans+for+the+prose+around+it,+and+contrast+tuned+low+enough+to+read+for+an+hour.&for=agentic-coding+docs,+dark&scale=3&density=3&contrast=3&measure=4
```

| Param | What it is |
|---|---|
| `pairs` | `display+text` slug pairs, comma-separated, max 4. A lone slug is a valid one-font card. |
| `theme` | curated index (`theme=3`) or hex roles `bg fg muted accent title subtitle paragraph rule label`. A hex you state renders exactly; what you omit is filled from a curated palette. |
| `themes` | plural, `;`-separated — a different palette **per card**. Beats `theme`. Reach for this whenever you're showing more than one direction. |
| `page` | the field behind the cards: `page=0B0E11` or named roles. |
| `title` / `subtitle` / `paragraph` | your copy, capped 120 / 200 / 600. Body copy is **`paragraph`**, not `body`. |
| `for` | one framing line above the cards, ≤150. |
| `scale` `density` `contrast` `measure` | coarse dials 1–5, default 3. Prefer these over `h1`/`h2`/`p` px. |

A slug is the family name lowercased with each run of non-alphanumerics collapsed
to one hyphen: `Playfair Display` → `playfair-display`, `DM Sans` → `dm-sans`,
`IBM Plex Mono` → `ibm-plex-mono`.

**Guessing is safe.** An unknown param is ignored, a bad hex is derived, and a
half-remembered slug resolves to the nearest real family — `source-serif` lands on
Source Serif 4 — with the substitution named in the render notes. Nothing here
blank-pages, so name the faces you believe fit and send the link.

**Do not fetch the composed URL back to check it.** Verification is a debugging
tool, not a step; see below. Write the URL, hand it over, done.

If you stopped reading here you would still get this right. The rest is reference.

---

## The rest

You can do four things here:

1. **Compose** a curated page for your user by writing a URL by hand — the above.
2. **Query** the font catalog, the pairing library, and the palettes as JSON,
   when you need data you can't recall.
3. **Hand off** paste-ready implementation config from the composed page.
4. **Verify** a URL that came back wrong, by fetching it and reading one element.

No auth, no keys, no rate limits, no installation. Fonts are Google Fonts; the
catalog is a static snapshot, so results are stable between refreshes.

---

## The one rule that will save you a wrong turn

**Check `ignored` in every JSON response.**

Unknown query params are ignored rather than rejected — a stale URL shouldn't
strand a human on an empty page. That means a typo'd or guessed param name looks
exactly like a filter that didn't work. Every response therefore carries an
`ignored` array naming the params we didn't recognize, and an `applied` object
echoing the filters that actually ran. If a filter seems to do nothing, read those
two fields before concluding the feature is missing.

Add `?strict=1` to any endpoint to get a `400` on unknown params instead.
(`/compose` accepts and ignores `strict` — it has no strict mode by design.)

---

## The JSON endpoints — and when they're worth a round-trip

Query these when you need **our** data: filtering by one of the 20 feeling tags,
our curated pairings, a variable font's real axis range, our palette hexes with
computed contrast. That is data you cannot recall, and it is what these are for.

For an open-ended request — "show me a few directions for a kid's party" — you
already know Google Fonts well enough. Skip the queries and write the compose URL
straight from the grammar above. Every round-trip here is latency your user feels,
and the near-miss slug resolution means you are not trading accuracy for it.

## GET /api/fonts

| Param | Values | Notes |
|---|---|---|
| `q` | free text | substring match on family name |
| `category` | `serif` `sans-serif` `display` `monospace` `handwriting` `all` | |
| `feeling` / `tag` | one of the 20 feelings below | `tag` is the original name; `feeling` is an accepted alias |
| `minWeight` | `0`–`100` | only fonts whose feeling weight clears this |
| `sort` | `popularity` `trending` `date` `alpha` | ignored when a feeling is set — those sort strongest-first |
| `limit` | 1–500, default 60 | |
| `offset` | integer, default 0 | |

**Feelings** (Google's `/Expressive` mood tags, 0–100 weight per font):
`active` `artistic` `awkward` `business` `calm` `childlike` `competent` `cute`
`excited` `fancy` `futuristic` `happy` `innovative` `loud` `playful` `rugged`
`sincere` `sophisticated` `stiff` `vintage`

About 20–30% of families carry no feeling tags at all. Absence means untagged, not
neutral.

Each family returns: `family`, `category`, `variants`, `axes` (variable-font axis
ranges), `feelings`, `subsets`, `popularityRank`, `trendingRank`, `lastModified`.

```
/api/fonts?feeling=sophisticated&category=serif&minWeight=60&limit=10
```

## GET /api/pairings

| Param | Values |
|---|---|
| `font` | a font slug, e.g. `playfair-display` |
| `limit` `offset` | paging the index |

With no `font`, returns an index of every family that has pairings. With `font`,
returns that family's `curated` (human-picked) and `suggested` (algorithmic
contrast-distance, each with a `why`) partners.

Every pairing includes `composeValue` — drop it straight into `/compose?pairs=`.

A `404` here means that family has no pairings, not that the slug is invalid.

## GET /api/palettes

Returns the 11 curated palettes, each with `index`, the four role hexes, computed
WCAG `contrast` ratios against the field, and which `moods` draw on it. Also
returns the mood definitions and the page chrome defaults.

Optional `mood` param narrows to one mood's palettes.

---

## Slugs

A slug is the family name, lowercased, non-alphanumerics collapsed to hyphens:
`"Playfair Display"` → `playfair-display`, `"DM Sans"` → `dm-sans`.

---

## GET /compose

Render a curated direction. Server-rendered, cacheable, shareable, stateless.

**The minimal URL is just fonts** — everything else has a good default, and the
default copy is publishable editorial prose, not lorem ipsum. Never burden
yourself with supplying text you have no signal about.

```
/compose?pairs=gloock+inter,dm-sans+playfair-display
```

| Param | Form | Notes |
|---|---|---|
| `pairs` | `display+text,display+text` | font slugs; **max 4** pairs. A lone slug (`pairs=fraunces`) is a valid one-font card. |
|  |  | Card width follows the count: one card renders wide (a single direction to iterate on), two or more share the width evenly. |
| `theme` | `3` or `bg:212121,accent:E34712` | curated index, or bring-your-own hex — one look the whole deck walks |
| `themes` | `bg:1D4ED8;bg:DC2626;bg:2563EB` | **per-card** palettes, `;`-separated, one per card; each item is the same grammar as `theme`. Wins over `theme`/`mood`. |
| `page` | `FAF7F0` or `bg:FAF7F0,fg:2C2824` | the viewport behind the cards; derived from the cards if omitted |
| `mood` | `subtle` `bold` `warm` `cool` | site picks from the curated set; cards walk the subset |
| `for` | free text, ≤150 chars | frames the page title |
| `title` `subtitle` `paragraph` | free text | ≤120 / ≤200 / ≤600 chars; any you omit falls back to the default copy |
| `scale` `density` `contrast` `measure` | `1`–`5`, default `3` | coarse dials: type size, padding, display weight, line length |
| `h1` `h2` `p` | px integers | absolute size overrides; clamped to 24–120 / 14–64 / 11–28; beat `scale` |

**Dials vs overrides.** `scale` moves the whole system in proportion — the right
answer to "this feels too shouty." `h1`/`h2`/`p` answer "the header specifically
is too big." Reach for the dial first. Leading is always derived from the
resulting size; you don't control it, and shouldn't.

**Revision is free.** Hold the previous params, change one, emit a new URL.

**Keep URLs under ~2,000 characters.** Not a server limit — Slack and mail clients
mangle longer links, and a link your user can't click has failed regardless of
what the server would have done.

### Color

Three ways in, in precedence order:

- `theme=3` — a curated index. Safest, and the default behavior.
- `mood=warm` — intent; the site picks.
- `theme=bg:212121,accent:E34712` — **named** roles (never positional). Anything
  you omit is derived from what you gave.

**Roles — every painted element is addressable.** `bg`, `fg`, `muted`, `accent`
are the palette. The rest name one element each, so you can put a specific color
on a specific thing:

| Role | Paints |
|---|---|
| `title` | the display line |
| `subtitle` | the deck |
| `paragraph` | the body copy |
| `rule` | the hairline above the font-name line |
| `label` | the font-name line itself |

```
theme=bg:D4DCE2,fg:1E262B,accent:36596C,subtitle:A32B25,rule:C6D0D6
```

**What you state is what renders.** A hex you write down is treated as an
intention — a brand color, a palette from a reference — so it is painted exactly
as given, even if it lands below the contrast bar. You get a note saying so; you
do not get a different color than the one you asked for.

**What you omit is filled from taste, not arithmetic.** Blending the ink into the
field is an average, and averages go grey — that's how the subtitle and the
paragraph used to come back as the same dull tone. So instead:

- `title` → `fg`
- `subtitle` → the **accent**, darkened only as far as body-size legibility needs.
  The color you chose does visible work rather than sitting on one small label.
- `paragraph` → `muted`, which is itself borrowed from the curated palette nearest
  your background — a designer's actual choice, not a computed midpoint.
- `rule` → a trace of accent over the field. `label` → `accent`.

Practical consequence: **`bg` + `fg` + `accent` is enough for a page with a point
of view.** You do not have to specify all eight to avoid a flat result.

**Two facets per element.** Each of `title`, `subtitle`, `paragraph` has a *text*
facet and a *color* facet, told apart by position: `subtitle=Some words` sets the
copy (a top-level param); `subtitle:A32B25` inside a `theme=`/`themes=` value sets
its color (a role). Same word, same element, two facets — never a collision.

**Per-card palettes.** `theme=` and `mood=` set one look the whole deck walks. To
give each card its *own* palette — three distinct looks in a single URL — use
`themes=` instead: a `;`-separated list, one spec per card, each spec the same
grammar as `theme` (a curated index or named `bg:…,fg:…` roles). One spec applies
to every card; N map by card index; fewer than the card count cycle; an unusable
spec falls back to a curated palette with a note. `themes` wins over
`theme`/`mood`. Because the cards now diverge, set an explicit neutral `page=` so
the field sits behind all of them rather than being derived from just the first.

```
themes=bg:1D4ED8,fg:FFFFFF,accent:FACC15;bg:DC2626,fg:FFF7ED,accent:FACC15;bg:2563EB,fg:FFFFFF,accent:F59E0B
```

**The page field.** `page` sets the viewport behind the cards, and reaches the
whole surface. Omit it and it is derived from the first card theme — a light
composition gets a light page, a dark one a near-black — so you only need it when
you want something the derivation wouldn't pick.

```
page=000000                      # bare hex: the background alone
page=bg:E6E1D8,fg:24211E         # named roles, same grammar as theme
```

The bring-your-own path exists for the case the curated set can't answer: *"here
are my brand colors, show me type that works with them."* Give us `bg` and
`accent` — the two you actually know — and let `fg` and `muted` be derived.

Contrast handling splits by who chose the color. Roles **we** derived are
contrast-checked against the background (4.5:1 for text, 3:1 for accent) and
nudged if they fall short — there's no intention there to preserve. Roles **you**
stated render untouched, with a note if they sit under the bar. That means you can
place any hex anywhere; it also means you can make a page unreadable if you insist,
so read the notes when you've supplied a full palette.

**One honest caveat:** the 11 *curated* palettes are hand-tuned for editorial feel
and several have a `muted` role below 4.5:1 — they are not all WCAG AA. Real
computed ratios are in `/api/palettes`; read them rather than assuming. If your
user needs guaranteed AA, supply your own `bg`/`fg` and let the rest derive.

---

## `#agent-notes` — a debugging tool, not a step

**Do not fetch a URL back as part of composing one.** Many agents are sandboxed to
a single fetch and can't anyway; that's fine by design. The page never fails, so a
link you never looked at is still safe to hand your user, and the round-trip is
latency they feel for no gain.

Fetch back when something is actually wrong — a user reports a card missing, or a
palette landed nowhere near what you asked for. Then read **`#agent-notes`**,
which is always present, and it will tell you exactly what the parser did.

It is **visually hidden** — present in the DOM as real text, rendered nowhere. It
is addressed to you, not to the person you sent the link to, so it does not appear
on their page. Deliberately not an HTML comment: comments are stripped by the
HTML-to-markdown conversion most fetch tools apply, and hidden text survives it.

```html
<section id="agent-notes" data-status="ok" data-note-count="0">
```

- `data-status="ok"` — every parameter was used as written.
- `data-status="degraded"` — something was dropped, clamped, or substituted. Each
  `<li data-note>` inside says what, in plain language.

The block also prints the **canonical** form of your URL — resolved slugs, fixed
key order, defaults omitted. Prefer it in revisions: it's the form the CDN caches,
so equivalent URLs share an entry.

Note the asymmetry with the JSON endpoints, which is deliberate: if you fetch one
of those and don't check `ignored`, you can act on a lie. If you skip the notes
here, the worst case is a page that renders slightly less than you asked for.

### Nothing here fails

- A font slug we don't know **resolves to the nearest real family** — normalized
  casing and punctuation, a missing version suffix (`source-serif` →
  Source Serif 4), or a one-character typo. Only a slug with no plausible match at
  all drops its card.
- A bad hex derives that one role. Over-long text truncates. An unknown param is
  ignored.

Every one of those is named in the notes, and the page always renders.

Because of this, **guessing is safe and encouraged** — that is a statement about
how the parser behaves, not an apology for it. Unsure whether a param exists, or
whether a family is spelled the way you remember? Write it. A cheap guess that
degrades cleanly beats both dropping what your user asked for and spending a
round-trip to remove doubt the parser already absorbs.

---

## The handoff

Every composed page carries an **Implementation** section at `#agent-specs`,
visually hidden in the same way as the notes block.

This is the one thing worth a fetch of the composed page — not because your URL
needs checking, but because the payload only exists there. Fetch it when your user
is actually going to implement the direction, not when you hand them the link:

- the Google Fonts css2 URL, as both a `<link>` tag and a CSS `@import`
- a Tailwind v4 `@theme` block with font and color tokens
- plain CSS custom properties, same content
- per-face specs: full font stack with fallbacks, discrete weights, variable axis
  ranges (`wght 100..900`, `opsz 9..144`), italic availability

**Check the axis range before reaching for `contrast`.** Many families cap well
below 900 — Space Grotesk stops at `wght 700`, which is already the default. Asking
for more renders identically and currently reports no note, so confirm the ceiling
in `/api/fonts` rather than trusting the dial. To go genuinely heavier, change the
face.

These are derived from the same catalog metadata that drove the render, so the
page and the snippets can't disagree. Hand them over verbatim — don't re-derive a
css2 URL yourself; the axis-tuple grammar is easy to get subtly wrong.

---

## A worked example

**Brief:** *"I'm writing long-form documentation for a developer tool. I want it
to feel calm and competent, not startup-y. Our brand color is a deep orange."*

This example queries first, because "calm and competent" names two of our feeling
tags and the user has a specific, long-lived surface in mind — that is when our
data earns the round-trips. For a lighter ask, skip straight to step 3 and write
the URL from memory.

1. Find the text face. Long-form reading, calm, competent:

   ```
   /api/fonts?feeling=calm&category=serif&minWeight=60&limit=10
   ```

2. Find a display partner for a promising one:

   ```
   /api/pairings?font=source-serif-4
   ```

   Take a `composeValue` from the response.

3. Compose two or three directions, with their brand color as the accent and a
   title that names their actual project — relevance comes from selectivity, not
   volume. One title naming the real product beats three paragraphs of
   typographic theory.

   ```
   /compose?pairs=source-serif-4+ibm-plex-sans,fraunces+work-sans
     &theme=bg:1A1A1A,accent:E34712
     &for=long-form+documentation
     &title=Ship+faster+with+fewer+surprises
     &measure=4
   ```

   `for` renders as a single small line above the cards — it is the only chrome a
   composed page carries, so use it to say what this *is* ("warm corporate
   direction for the yoga site"). There is no site nav or footer on `/compose`.

4. Give your user the link. If they say "I like it but the headline is too big,"
   send `&h1=44`. If they say "it all feels too loud," send `&scale=2`. Each
   revision is a new URL, not a new fetch.

5. **Only if they're ready to build it**, fetch the composed page once and hand
   over `#agent-specs` — the `@import`, the Tailwind theme block, the font stacks.
   That is the one fetch worth making, and it is for the payload, not to check
   your work.

6. When they pick one, drop the others: `pairs=` with a single value renders it
   wide, as the direction being refined rather than one option among several.

**A color key** sits below the cards showing every specified color as a labeled
swatch with its hex. It is for the person, not for you — it gives them the exact
vocabulary to revise with ("make A32B25 darker" rather than "the red's too
bright"), so expect revision requests to come back in hexes.

---

## Not available

No image rendering, no persistence, no short links, no accounts, no write access.
Composed pages are stateless — the URL is the entire state, which is why they're
safe to share and free to revise.
