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
     "title": "Short headline for the release",
     "changes": ["First change.", "Second change."],
     "files": ["path/to/file.tsx — what lives here / why it changed"]
   }
   ```
   Use today's date. If an entry with today's date already exists and describes
   the same session, merge the new bullets into it rather than adding a duplicate.
4. Fill `files` with the handful of key files the change centers on, each as
   `path — one-line note`. This is the part that doubles as agent memory: a
   future agent reads the changelog to learn what changed recently and where it
   lives, so favor the files someone would need to open to continue the work
   (not every file in the diff). Omit `files` only for trivial entries.
5. Prepend the entry so the file stays newest-first (it is a top-level JSON array).
6. Keep it terse, no emojis, and make sure the file remains valid JSON.

Do not commit unless the user asks.
