# Agent story: "Show me three birthday-invite looks"

A cold-agent friction log, kept because feeding a real agent's experience back
into the surface is how `/compose` gets better. This is the run that drove the
per-card `themes=` work and the one-fetch root quickstart; a later evaluation on a
second brief added friction #7 and drove near-miss slug resolution.

> **This log spans separate sessions — read it as a before/after, not one trace.**
> The friction points below are the *pre-fix* cold failure. Where a later run
> "worked," that smoothness was carryover — the `/compose` grammar was already in
> the agent's context from earlier fixes, not something a genuinely cold agent
> would have reached (see friction #2). The one-fetch quickstart exists precisely
> to make the cold path succeed on its own.

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

## Session two: the round-trip tax

A later evaluation ran a different brief — "three cards for a kid's party" —
against the fixed surface. It worked. It was also **slower than the task
deserved**, and the agent's own post-mortem was the useful artifact: asked
afterward to just hand-write a URL from the grammar, it produced an equally good
result in **zero tool calls**. Everything between those two runs was tax.

- **7 → the surface invited round-trips it didn't need.** Three causes, in
  descending order of how much we control them:

  1. **We gave contradictory instructions.** The root quickstart said "Do NOT
     fetch the URL back to check it." `public/agent.md`'s worked example said
     "Fetch that URL back. Confirm `data-status="ok"`." An agent reading both
     resolves the conflict by doing the slower thing — that is the safe read.
  2. **"Guessing is safe" wasn't fully true.** It covered params but not slugs: a
     near miss like `source-serif` for Source Serif 4 dropped a whole card. That
     residual risk is *exactly* what a verification round-trip buys down, so
     verifying was the rational move, not an over-cautious one. Prose telling an
     agent to skip a check it has a real reason to make will lose.
  3. **A fetch-tool detour we don't control.** The agent's client refused a
     relative `/agent.md` because it wasn't a URL from a prior result, costing two
     failed fetches and a junk search before falling back to `curl`. Worth knowing
     other agents hit this differently; already mitigated by the one-fetch root
     block and by rendering the pointers as real anchors (friction 2).

  **Fixes.** Cause 2 first, because it's load-bearing and the rest is only
  documentation: `lib/font-match.ts` resolves near misses — normalization, missing
  version suffix, edit distance ≤ 2 under a ratio guard — and names the
  substitution in the notes. The guard matters as much as the match: `helvetica`
  still resolves to nothing, because a matcher that always finds *something* turns
  a wrong guess into a silently wrong specimen. Then cause 1: one stance
  everywhere — fetch-back is a debugging tool, never a step — and `agent.md` gained
  a front-loaded one-shot block so an agent that reads only the first screen can
  already emit correctly.

  The honest exception, now stated rather than papered over: `#agent-specs` only
  exists on the composed page, so a user who is actually going to *build* the
  direction does cost one fetch. That fetch is for the payload, not to check the
  work.

**The generalizable lesson.** An agent's extra round-trips are usually a rational
response to real residual risk. Removing the *risk* removes the round-trip;
telling the agent not to worry does not.

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
