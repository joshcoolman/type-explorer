# Backlog page

`/backlog` renders `BACKLOG.md` as a list of collapsible cards. It is the parked-
ideas / future-work surface, parsed at build time from the markdown — there is no
database.

## Where the content comes from

**GitHub Issues are the source of truth.** `BACKLOG.md` is a *generated artifact*,
written by `pnpm backlog:sync` (`scripts/sync-backlog.mjs`) and committed.

```
GitHub Issues  --(pnpm backlog:sync, run locally)-->  BACKLOG.md  --(build)-->  /backlog
```

Do not hand-edit `BACKLOG.md`; the next sync overwrites it. To add a backlog item,
open an issue. To close one, close the issue and re-sync.

Three reasons for the indirection rather than fetching issues at build time:

- **The site stays static.** `/backlog` is prerendered from a file on disk, with no
  runtime API call and no dependency on GitHub being reachable — the same posture
  as `data/fonts.json` and `content/pairing-library.json`.
- **The commit is the moderation gate.** The repo is public with issues open, so
  anyone can file one. Nothing a stranger writes reaches the site until someone
  runs the sync, reads the diff, and commits it.
- **The backlog stays in git history** next to the code it describes.

Status comes from labels (`idea`, `ready`, `in progress`, `parked`), except that a
**closed issue is always `shipped`** — state beats label. An unlabelled open issue
defaults to `idea`.

The script refuses to write an empty `BACKLOG.md` unless passed `--force`: zero
issues almost always means issues got disabled or `gh` lost auth, not that the
backlog is genuinely empty. `--dry-run` previews without writing.

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
