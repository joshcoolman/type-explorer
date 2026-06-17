---
description: Add a changelog entry for recent work to content/changelog.json
---

Update the changelog at `content/changelog.json` to capture the work that just
happened. This file is rendered by the `/changelog` page in the app.

Steps:

1. Figure out what changed since the last entry. Look at the uncommitted diff
   (`git status` + `git diff`) and recent commits not yet reflected in the
   changelog (`git log --oneline -20`). If the user gave specifics in
   `$ARGUMENTS`, prefer those.
2. Write ONE entry summarizing the change set from a user's point of view — what
   is different about the app, not how the code was refactored. Keep each bullet
   to a sentence. Group everything from this work session into a single entry.
3. The entry shape is:
   ```json
   {
     "date": "YYYY-MM-DD",
     "commit": "<short hash>",
     "title": "Short headline for the release",
     "changes": ["First change.", "Second change."],
     "files": ["path/to/file.tsx — what lives here / why it changed"]
   }
   ```
   Use today's date.
4. The card groups by `commit`, not date — it shows the short hash linked to the
   GitHub commit. Because an entry can't contain its own commit's hash, fill
   `commit` with the hash of the commit that LANDED this work (i.e. record it in
   the follow-up commit that updates the changelog). If you don't have the hash
   yet, leave `commit` out — the card falls back to showing the date — and add it
   once the work is committed.
5. Fill `files` with the handful of key files the change centers on, each as
   `path — one-line note`. This is the part that doubles as agent memory: a
   future agent reads the changelog to learn what changed recently and where it
   lives, so favor the files someone would need to open to continue the work
   (not every file in the diff). Omit `files` only for trivial entries.
6. Prepend the entry so the file stays newest-first (it is a top-level JSON array).
7. Keep it terse, no emojis, and make sure the file remains valid JSON.
8. **Backlog sweep.** The same shipped work that earns a changelog entry often
   closes a backlog item — and the two drift apart because nothing links them.
   After writing the entry, skim `BACKLOG.md` for any open item (status tag not
   `shipped` / `done` / `closed`) that this change set now sufficiently covers,
   and flip its tag to `shipped`. Leave the body as the historical record; add a
   one-line "Shipped via …" note if what shipped differs from what was asked. See
   `docs/backlog.md` for the tag mechanics. Skip for trivial entries.

Do not commit unless the user asks.
