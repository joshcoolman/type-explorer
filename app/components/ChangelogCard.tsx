const REPO = "https://github.com/joshcoolman/type-explorer";

/**
 * One fixed green/cream treatment for every changelog card. The changelog is a
 * technical page, so it skips the per-card color variety the specimen grid uses.
 * (Mirrors CARD_THEMES[0].)
 */
const THEME = {
  bg: "#40534C",
  fg: "#F0E4D3",
  muted: "#AEBAB0",
};

export interface ChangelogEntry {
  date: string;
  title: string;
  changes: string[];
  /** Short hash of the commit this entry describes; shown as a GitHub link. */
  commit?: string;
  /**
   * Key files this entry touched. Doubles as agent orientation — a map from
   * "what changed" to "where it lives" — and is rendered as a small reference
   * list on the card. Optional.
   */
  files?: string[];
}

/**
 * A full-width changelog entry — a fixed green field with the commit link on top,
 * a big display title, the change list (numbered, rule-separated), and an
 * optional key-files reference. One card per entry; no favorite / action controls.
 */
export default function ChangelogCard({
  entry,
  index,
}: {
  entry: ChangelogEntry;
  index: number;
}) {
  return (
    <article
      className="flex flex-col rounded-2xl p-8 sm:p-10"
      style={{ background: THEME.bg, color: THEME.fg }}
    >
      {entry.commit ? (
        <a
          href={`${REPO}/commit/${entry.commit}`}
          target="_blank"
          rel="noreferrer"
          className="w-fit font-mono text-[11px] tracking-[0.12em] underline-offset-4 transition-colors hover:underline"
          style={{ color: THEME.muted }}
        >
          {entry.commit}
        </a>
      ) : (
        <time
          dateTime={entry.date}
          className="font-mono text-[11px] uppercase tracking-[0.16em]"
          style={{ color: THEME.muted }}
        >
          {formatDate(entry.date)}
        </time>
      )}
      <div
        className="mb-6 mt-3"
        style={{ borderTop: `0.5px solid ${THEME.muted}` }}
      />

      <h2 className="text-3xl font-bold leading-[1.05] sm:text-4xl">
        {entry.title}
      </h2>

      <ul className="mt-8">
        {entry.changes.map((change, i) => (
          <li
            key={i}
            className="flex gap-4 py-4 text-base leading-relaxed first:pt-0"
            style={
              i > 0 ? { borderTop: `0.5px solid ${THEME.muted}` } : undefined
            }
          >
            <span
              aria-hidden="true"
              className="shrink-0 pt-1 font-mono text-xs tracking-wider tabular-nums"
              style={{ color: THEME.muted }}
            >
              {index}.{i + 1}
            </span>
            <span style={{ color: THEME.fg }}>{change}</span>
          </li>
        ))}
      </ul>

      {entry.files && entry.files.length > 0 && (
        <div className="mt-8">
          <div
            className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em]"
            style={{ color: THEME.muted }}
          >
            Key files
          </div>
          <ul className="flex flex-col gap-1">
            {entry.files.map((file) => (
              <li
                key={file}
                className="font-mono text-xs leading-relaxed"
                style={{ color: THEME.muted }}
              >
                {file}
              </li>
            ))}
          </ul>
        </div>
      )}
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
