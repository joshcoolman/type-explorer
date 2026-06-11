# Continue

## What was being worked on

Created `SPEC.md` — the seed specification for **type-explorer**, an agent-driven Google Fonts type-specimen generator. Spec only; no code exists yet. This folder is not a git repo yet.

## Changes made so far

- Wrote `SPEC.md` (the only file besides this one). It is a complete, phased implementation spec covering: font catalog layer (Webfonts API cached to `data/fonts.json`, css2 for browser loading), three-view UI (Browse / Brief / Library), two-tier agent integration, specimen format contract, jobs/SSE/storage, API routes, public-repo checklist, build order.

## Key decisions

- **Next.js App Router** — deliberately mirrors `~/repos/repo-explorer`, whose `lib/jobs.ts`, `lib/store.ts`, SSE route, and Agent SDK `query()` pattern (`lib/analyze.ts`) are to be ported nearly verbatim. `serverExternalPackages: ["@anthropic-ai/claude-agent-sdk"]` required in next.config.
- **Two-tier agent split**: proposals = one cheap plain-SDK structured-output call validated against the cached catalog; full specimen generation = Agent SDK job with vendored `.claude/skills/type-specimen/` skill, only after the user picks a pairing.
- **Skill change from the Claude Desktop original** (`~/repos/type-spec/type-specimen.skill`): no web-artifacts-builder/React build. Static `template.html` + vanilla JS (repo-explorer skill style), agent fills placeholders. Same 10-section specimen anatomy and HSL-channel token system as the reference specimens in `~/repos/type-spec/`.
- **Anti-hallucination guardrail**: real font metadata (weights, axes, italics) and the pre-built css2 URL are injected into the agent prompt from the cached catalog; the model never constructs axis lists itself. `lib/css2-url.ts` owns axis-ordering rules and gets unit tests.
- **v1 scope**: pairings only, structured brief → options → pick flow (no chat), local-first, file storage, no DB. Repo intended to go public.
- Env: `ANTHROPIC_API_KEY` + free `GOOGLE_FONTS_API_KEY` (Webfonts Developer API, 10k req/day).

## Outstanding work

- Nothing implemented. Next step is SPEC.md section 11, Phase 1: scaffold Next.js, `lib/catalog.ts`, `lib/css2-url.ts` + tests, `/api/fonts`, Browse view with live previews.
- `git init` and an initial commit of SPEC.md would be a sensible first action.

## Git state

Not a git repository. No commits, no remote. Files present: `SPEC.md`, `continue.md`.
