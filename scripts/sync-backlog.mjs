// Regenerate BACKLOG.md from this repo's GitHub Issues.
//
//   pnpm backlog:sync              write BACKLOG.md from the current issues
//   pnpm backlog:sync --dry-run    print what would change, write nothing
//
// GitHub Issues are the source of truth for the backlog; BACKLOG.md is a
// generated, committed artifact that `app/backlog/page.tsx` reads at build time.
//
// That indirection is deliberate, and it is the whole design:
//
//  - The site stays static. `/backlog` is prerendered from a file on disk, with
//    no runtime API call, no token, and no dependency on GitHub being up —
//    matching how `data/fonts.json` and `content/pairing-library.json` work.
//  - **The commit is the moderation gate.** The repo is public with issues open,
//    so anyone can file one. Nothing they write reaches the site until a human
//    runs this script, reads the diff, and commits it. Fetching issues live at
//    build time would publish a stranger's text automatically.
//  - The backlog stays reviewable in git history alongside the code it describes.
//
// Auth comes from the `gh` CLI, so there is no token to manage. Public repos can
// be read unauthenticated (60 req/hr), but `gh` is already a dependency of this
// repo's workflow and raises that ceiling for free.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "BACKLOG.md");
const REPO = "joshcoolman/type-explorer";

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

/**
 * Issue labels that map to a backlog status tag, in priority order — an issue
 * carrying several wins the first match. Anything unlabelled is an `idea`, which
 * is the honest default for "someone filed this and nobody has triaged it."
 */
const STATUS_LABELS = ["in progress", "ready", "parked", "idea"];

/** A closed issue is shipped regardless of its labels — state beats tag. */
const CLOSED_STATUS = "shipped";

const PREAMBLE = `# Backlog

Lightweight idea tracker. Status tags: \`idea\` · \`ready\` · \`in progress\` · \`parked\`

> **Generated file — do not edit by hand.** The source of truth is
> [GitHub Issues](https://github.com/${REPO}/issues); run \`pnpm backlog:sync\` to
> regenerate this from them, then commit the diff. Hand edits are lost on the next
> sync.
`;

function fetchIssues() {
  // --paginate handles >100; pull-requests are excluded below (the issues API
  // returns PRs too, distinguished only by a `pull_request` key).
  const raw = execFileSync(
    "gh",
    [
      "api",
      "--paginate",
      `repos/${REPO}/issues?state=all&per_page=100`,
      "--jq",
      ".[] | {number, title, body, state, labels: [.labels[].name], pr: (has(\"pull_request\"))}",
    ],
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );

  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((i) => !i.pr);
}

function statusFor(issue) {
  if (issue.state.toLowerCase() === "closed") return CLOSED_STATUS;
  const lower = issue.labels.map((l) => l.toLowerCase());
  return STATUS_LABELS.find((s) => lower.includes(s)) ?? "idea";
}

/**
 * One issue as a backlog section. The heading shape is load-bearing:
 * `app/backlog/page.tsx` splits on `## ` and reads the trailing backtick tag, so
 * changing this format silently breaks the page.
 */
function renderSection(issue) {
  const status = statusFor(issue);
  const body = (issue.body ?? "").replace(/\r\n/g, "\n").trim();
  // Strip the migration footer the one-time import added, so re-syncs stay clean.
  const cleaned = body.replace(/\n*---\n_Migrated from `BACKLOG\.md`\._\s*$/, "").trim();
  const link = `[#${issue.number}](https://github.com/${REPO}/issues/${issue.number})`;
  return `## ${issue.title} \`${status}\`\n\n${cleaned || "_No description._"}\n\n${link}\n`;
}

function render(issues) {
  // Open first, then closed; newest issue first within each group. Open work is
  // what anyone opening the page came to see.
  const rank = (i) => (i.state.toLowerCase() === "closed" ? 1 : 0);
  const sorted = [...issues].sort(
    (a, b) => rank(a) - rank(b) || b.number - a.number,
  );
  return [PREAMBLE, ...sorted.map(renderSection)].join("\n---\n\n");
}

function main() {
  let issues;
  try {
    issues = fetchIssues();
  } catch (err) {
    console.error("Failed to reach GitHub via `gh`.");
    console.error("Is the gh CLI installed and authenticated? Try: gh auth status");
    console.error(String(err.stderr ?? err.message ?? err).trim());
    process.exit(1);
  }

  const open = issues.filter((i) => i.state.toLowerCase() !== "closed").length;
  console.log(`Fetched ${issues.length} issues (${open} open, ${issues.length - open} closed).`);

  // An empty result is far more likely a disabled-issues repo, a revoked token,
  // or an API hiccup than a genuinely empty backlog — and this script overwrites
  // a committed file. Refuse rather than silently wipe it.
  if (issues.length === 0 && !FORCE) {
    console.error(
      "\nRefusing to write an empty BACKLOG.md.\n" +
        "Zero issues usually means issues are disabled on the repo or `gh` lost auth,\n" +
        "not that the backlog is empty. Pass --force if you really mean it.",
    );
    process.exit(1);
  }

  const next = render(issues);
  const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, "utf8") : "";

  if (next === current) {
    console.log("BACKLOG.md already up to date.");
    return;
  }

  if (DRY_RUN) {
    console.log(`\n--dry-run: would rewrite BACKLOG.md (${current.length} -> ${next.length} bytes).`);
    return;
  }

  fs.writeFileSync(OUT_FILE, next);
  console.log(`Wrote ${OUT_FILE}. Review the diff, then commit it.`);
}

main();
