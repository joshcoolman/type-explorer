# Agent story: "Show me three birthday-invite looks"

A cold-agent friction log, kept because feeding a real agent's experience back
into the surface is how `/compose` gets better. This is the run that drove the
per-card `themes=` work and the one-fetch root quickstart.

## The scenario

A non-technical parent pastes only the live site URL and says: *"My kid's
birthday party — he's a young boy who's into Superman and comics. Give me three
invitation options, make up the text, I just need to see something."*

Desired outcome: within seconds the agent returns **one clickable link** showing
three cards, three distinct looks, personalized to the request — which the parent
opens and reacts to ("love the red one, warm up the first"). **That reaction loop
is the product.**

## The friction log (what a cold agent hit, in order)

1. **The cold start gave nothing to build with.** The first fetch — the site root,
   the one page a pasted-URL agent can reliably reach — returned the "Agent Ready"
   teaser and a prose instruction to go fetch `/agent.md`. No grammar, no example,
   no palette vocabulary. Everything usable was one hop away.
2. **That hop was unreachable.** `/agent.md` and `/llms.txt` were mentioned as
   prose, not links, and sandboxed fetch tooling only follows URLs that surface as
   real results. A genuinely cold agent was stuck at step one.
3. **The text-personalization syntax never arrived — the biggest miss.** The
   param names (`title`/`subtitle`/`paragraph`) lived only in `/agent.md`, so the
   agent shipped cards with no custom text — the opposite of "personalized" — and
   mostly did so silently instead of announcing the blocker.
4. **Three looks in one view wasn't expressible.** `pairs` is a list, so three
   fonts in one page was easy — but `theme` and `page` were page-global, so three
   color concepts meant three separate URLs.
5. **`subtitle` looked overloaded.** It is both a `theme` color role and a text
   field; the agent disambiguated by position but read it as a latent collision.
6. **"Verify by fetching back" is impossible for a sandboxed agent.** The contract
   presented fetch-back as a step, quietly excluding the least-capable agent the
   surface is designed for.

## What was done (fixes, mapped to the log)

- **1, 2, 3 → the one-fetch root quickstart.** The whole construct-a-URL contract
  is inlined into the home page's server-rendered HTML (`app/page.tsx`,
  `AgentQuickstart`), with a site-wide pointer on every route (`app/layout.tsx`).
  It carries the full grammar, the real param names, the slug rule, a dark
  palette, and worked examples. `/agent.md` + `/llms.txt` are now real anchor
  links — enrichment, never the critical path.
- **4 → per-card palettes (`themes=`).** A `;`-separated list, one palette per
  card, same grammar as `theme`. The render layer already indexed a themes array
  per card, so this was a parser-only change in `lib/compose-params.ts`. See
  `public/agent.md` and `docs/plans/agent-surface-v1.md`.
- **5 → docs, not a rename.** There is no real parser collision: text is a
  top-level param (`?subtitle=`), color is a role inside a theme value
  (`theme=subtitle:HEX`). `public/agent.md` now states the "two facets per
  element" model plainly. The names stay, preserving the text/color symmetry.
- **6 → fetch-back reframed as optional.** `public/agent.md` marks `#agent-notes`
  verification as optional for agents that can re-fetch, and blesses
  guess-and-degrade: an unknown param is ignored and the page still renders, so
  attempting an uncertain one beats dropping the intent.

## The target URL (what a fixed surface lets an agent produce on turn one)

```
https://googlefontfinder.com/compose?pairs=bangers+nunito,bungee+poppins,luckiest-guy+quicksand&themes=bg:1D4ED8,fg:FFFFFF,accent:FACC15,subtitle:FDE68A;bg:DC2626,fg:FFF7ED,accent:FACC15,subtitle:FECACA;bg:2563EB,fg:FFFFFF,accent:F59E0B,subtitle:BFDBFE&page=bg:0B1220&title=Super+Kids+Party&subtitle=Capes,+Cake+and+Comic-Book+Chaos&paragraph=Fly+in+for+the+birthday+of+the+year.+Heroes+assemble+Saturday+at+2.
```

Three comic looks — hero blue, pop red, blue-orange — one personalized message,
one link. ~430 characters, comfortably under the ~2K budget.

## Acceptance (the retry test)

Cold session. Agent given only `https://googlefontfinder.com/` and the Superman
request. Success =

- one `/compose` URL,
- three cards, three distinct palettes,
- personalized copy ("Super Kids Party" etc.) actually rendered,
- produced with zero further network calls, and
- deleting the GitHub README changes nothing.

## Deferred: getting more metadata into a request

The ~2K URL ceiling is a property of the click-a-link GET channel (chosen so any
agent can emit a link), not a static-site limit. If payloads ever outgrow it, the
one option that preserves the click-a-link UX and stays fully static is a
**pointer param** — `?src=<url-to-json>`, where the page client-fetches an
untrusted JSON spec and renders it through the existing derive/truncate/`ignored[]`
model. It needs permissive CORS and somewhere for the agent to host the JSON.

Not needed today: per-card palettes plus per-card text land well under budget for
cases like this one. Deferred until a real payload forces it.
