import type { Metadata } from "next";
import { Label, typeRole } from "../components/ui";
import { PAGE_THEME } from "../../lib/card-themes";
import ChangelogCard, { type ChangelogEntry } from "../components/ChangelogCard";
import changelog from "../../content/changelog.json";

export const metadata: Metadata = {
  title: "Changelog — Type Explorer",
  description: "A running log of changes to Type Explorer.",
};

/** Page-chrome colors, matching the rest of the app's dark surfaces. */
const UI = {
  bg: PAGE_THEME.bg,
  fg: PAGE_THEME.fg,
  muted: PAGE_THEME.muted,
  accent: PAGE_THEME.accent,
};

export default function ChangelogPage() {
  const entries = changelog as ChangelogEntry[];

  return (
    <main className="min-h-screen" style={{ background: UI.bg, color: UI.fg }}>
      {/* Narrower than the app container — this page is just a column of cards,
          so it caps at the card's comfortable reading width. */}
      <div className="mx-auto w-full max-w-2xl px-5 py-12 sm:px-8 sm:py-16">
        <header className="mb-10">
          <Label style={{ color: UI.accent }}>Type Explorer</Label>
          <h1 className={`mt-2 ${typeRole.display}`}>Changelog</h1>
          <p
            className="mt-3 max-w-xl text-sm leading-relaxed"
            style={{ color: UI.muted }}
          >
            A running log of what has changed, newest first. This entire app is
            open source —{" "}
            <a
              href="https://github.com/joshcoolman/type-explorer"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4 transition-colors hover:opacity-80"
              style={{ color: UI.accent }}
            >
              view it on GitHub
            </a>
            .
          </p>
        </header>

        <div className="flex flex-col gap-6">
          {entries.map((entry, i) => (
            <ChangelogCard
              key={`${entry.date}-${entry.title}`}
              entry={entry}
              index={i}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
