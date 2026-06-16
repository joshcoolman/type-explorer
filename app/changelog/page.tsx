import type { Metadata } from "next";
import { PageHeader } from "../components/ui";
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
    <main className="flex-1" style={{ background: UI.bg, color: UI.fg }}>
      {/* Header and cards share one narrow centered column, so the header lines
          up with the left edge of the changelog cards. */}
      <div className="mx-auto w-full max-w-2xl px-5 pt-6 pb-12 sm:px-8 sm:pt-8 sm:pb-16">
        <PageHeader title="Changelog" className="mb-10" />
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
