# Backlog page

`/backlog` renders `BACKLOG.md` as a list of collapsible cards. It is the parked-
ideas / future-work surface, parsed at build time from the markdown — there is no
database.

## How it's parsed

`app/backlog/page.tsx` reads `BACKLOG.md` and splits on `## ` headings. Each
section becomes a card:

```
## Heading text `status`
body markdown…
```

The backtick tag after the heading is the **status**. It is metadata only — not
rendered as a chip. `app/backlog/BacklogList.tsx` renders the cards (collapsed to
the heading, expanding to the full markdown body via `react-markdown`).

## Open / closed lifecycle

A section is **closed** when its status tag is one of `closed` / `done` /
`shipped` (`CLOSED_STATUSES` in `page.tsx`). Everything else is **open**.

- Two segmented pills (Open / Closed, with counts) sit above the cards; default
  is Open. The toggle is **exclusive** — closed items are hidden from the Open
  view and only appear under the Closed pill.
- Open cards use the green theme; **closed cards use the darker blue**
  (`#2E434F` ground, whitish `#DEE6EA` text). Expand/collapse is identical.

## To close an issue

Change its status tag in `BACKLOG.md`, e.g.
`## Bookmarkable pairing routes \`idea\`` → `\`shipped\``. That's the whole
operation — the page re-derives open/closed from the tag. Closed bodies are left
as the historical record of what the issue asked for (present tense is fine).

**When this happens:** the commit ritual ties it to the changelog — whenever you
add a changelog entry (or run `/changes`), sweep here for items that the work now
covers and close them in the same commit. See "the commit ritual" in `CLAUDE.md`.

## Key files

- `BACKLOG.md` — the source content (headings + `status` tags)
- `app/backlog/page.tsx` — parser, `CLOSED_STATUSES`, `BacklogSection` type
- `app/backlog/BacklogList.tsx` — pills, exclusive filter, open/closed card themes
