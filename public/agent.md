# Type Explorer — agent contract

Everything you need is on this page. Base URL: `https://googlefontfinder.com`

You can do four things here:

1. **Query** the font catalog, the pairing library, and the palettes as JSON.
2. **Compose** a curated page for your user by writing a URL by hand.
3. **Verify** what you composed by fetching it back and reading one element.
4. **Hand off** paste-ready implementation config from that same page.

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

---

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
| `theme` | `3` or `bg:212121,accent:E34712` | curated index, or bring-your-own hex |
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

**Roles.** `bg`, `fg`, `muted`, `accent` are the palette. `title`, `subtitle` and
`paragraph` override one text element each and fall back to the palette when
absent — `fg` carries the title, `muted` carries both the subtitle and the
paragraph, so without these there is no way to color the deck without dragging the
body copy with it.

```
theme=bg:D4DCE2,fg:1E262B,accent:36596C,subtitle:A32B25
```

Note `subtitle` means two different things by position: `subtitle=Some words` is
the text, `theme=subtitle:A32B25` is its color. Same for `title` and `paragraph`.

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

Derived roles are contrast-checked against the background (4.5:1 for text roles,
3:1 for accent) and nudged if they fall short, with a note. Values you supply
yourself are checked too, and adjusted if they'd be illegible.

**One honest caveat:** the 11 *curated* palettes are hand-tuned for editorial feel
and several have a `muted` role below 4.5:1 — they are not all WCAG AA. Real
computed ratios are in `/api/palettes`; read them rather than assuming. If your
user needs guaranteed AA, supply your own `bg`/`fg` and let the rest derive.

---

## Verifying what you composed

Fetch your own composed URL back and read **`#agent-notes`**. It is always present.

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

The block also prints the **canonical** form of your URL. Prefer it in revisions:
it's the form the CDN caches, so equivalent URLs share an entry.

This matters because you probably can't see the rendered page. Fetching back
without reading this element only confirms the server answered — it tells you
nothing about whether the page says what you meant.

### Nothing here fails

A bad font slug drops that one card. A bad hex derives that one role. Over-long
text truncates. An unknown param is ignored. The page always renders, and always
tells you what it did. So a malformed URL costs you a note, not a broken link in
front of your user — but do read the notes, because your user sees the result
either way.

---

## The handoff

Every composed page carries an **Implementation** section at `#agent-specs`,
visually hidden in the same way as the notes block and readable on fetch-back:

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

4. Fetch that URL back. Confirm `#agent-notes` reads `data-status="ok"`.

5. Give your user the link, and the `#agent-specs` block for whoever implements
   it. If they say "I like it but the headline is too big," send `&h1=44`. If they
   say "it all feels too loud," send `&scale=2`.

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
