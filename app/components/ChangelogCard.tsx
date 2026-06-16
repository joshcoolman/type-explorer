import { themeForIndex } from "../../lib/card-themes";

export interface ChangelogEntry {
  date: string;
  title: string;
  changes: string[];
  /**
   * Key files this entry touched. Doubles as agent orientation — a map from
   * "what changed" to "where it lives" — and is rendered as a small reference
   * list on the card. Optional.
   */
  files?: string[];
}

/**
 * A full-width changelog entry in the app's card language — a per-index color
 * field with a big display title, the change list (numbered, rule-separated),
 * an optional key-files reference, and the date as the mono accent label. One
 * card per dated entry; carries no favorite / action controls.
 */
export default function ChangelogCard({
  entry,
  index,
}: {
  entry: ChangelogEntry;
  index: number;
}) {
  const theme = themeForIndex(index);

  return (
    <article
      className="flex flex-col rounded-2xl p-8 sm:p-10"
      style={{ background: theme.bg, color: theme.fg }}
    >
      <h2 className="text-3xl font-bold leading-[1.05] sm:text-4xl">
        {entry.title}
      </h2>

      <ul className="mt-8">
        {entry.changes.map((change, i) => (
          <li
            key={i}
            className="flex gap-4 py-4 text-base leading-relaxed first:pt-0"
            style={
              i > 0
                ? { borderTop: `0.5px solid ${theme.muted}` }
                : undefined
            }
          >
            <span
              aria-hidden="true"
              className="shrink-0 pt-1 font-mono text-xs tracking-wider tabular-nums"
              style={{ color: theme.muted }}
            >
              {index}.{i + 1}
            </span>
            <span style={{ color: theme.fg }}>{change}</span>
          </li>
        ))}
      </ul>

      {entry.files && entry.files.length > 0 && (
        <div className="mt-8">
          <div
            className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em]"
            style={{ color: theme.muted }}
          >
            Key files
          </div>
          <ul className="flex flex-col gap-1">
            {entry.files.map((file) => (
              <li
                key={file}
                className="font-mono text-xs leading-relaxed"
                style={{ color: theme.muted }}
              >
                {file}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 pt-4" style={{ borderTop: `0.5px solid ${theme.muted}` }}>
        <time
          dateTime={entry.date}
          className="font-mono text-[11px] uppercase tracking-[0.16em]"
          style={{ color: theme.accent }}
        >
          {formatDate(entry.date)}
        </time>
      </div>
    </article>
  );
}

/** Render an ISO date as a stable, locale-independent label (no Date() at build). */
function formatDate(iso: string): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${months[m - 1]} ${d}, ${y}`;
}
