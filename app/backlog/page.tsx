import type { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import ReactMarkdown from "react-markdown";
import { PageHeader } from "../components/ui";
import { PAGE_THEME } from "../../lib/card-themes";

export const metadata: Metadata = {
  title: "Backlog — Type Explorer",
  description: "Parked ideas and future directions for Type Explorer.",
};

const UI = { bg: PAGE_THEME.bg, fg: PAGE_THEME.fg, muted: PAGE_THEME.muted };

/** Same green/cream field as the changelog cards. */
const THEME = { bg: "#40534C", fg: "#F0E4D3", muted: "#AEBAB0" };

/** Split the markdown into one block per `## ` section. */
function parseSections(
  raw: string,
): Array<{ heading: string; status: string | null; body: string }> {
  return raw
    .split(/\n(?=## )/)
    .filter((s) => s.trimStart().startsWith("## "))
    .map((s) => {
      const nl = s.indexOf("\n");
      const rawHeading = nl === -1 ? s.slice(3) : s.slice(3, nl);
      const body = nl === -1 ? "" : s.slice(nl + 1).trim();
      // Strip trailing `status` tag from heading: "Title `tag`" → "Title", "tag"
      const tagMatch = rawHeading.match(/^(.*?)\s*`([^`]+)`\s*$/);
      const heading = tagMatch ? tagMatch[1].trim() : rawHeading.trim();
      const status = tagMatch ? tagMatch[2] : null;
      return { heading, status, body };
    });
}

function BacklogCard({
  heading,
  status,
  body,
}: {
  heading: string;
  status: string | null;
  body: string;
}) {
  return (
    <article
      className="flex flex-col rounded-2xl p-8 sm:p-10"
      style={{ background: THEME.bg, color: THEME.fg }}
    >
      {status && (
        <span
          className="mb-4 w-fit font-mono text-[11px] uppercase tracking-[0.16em]"
          style={{ color: THEME.muted }}
        >
          {status}
        </span>
      )}
      <h2 className="text-3xl font-bold leading-[1.05] sm:text-4xl">
        {heading}
      </h2>
      <div
        className="mb-6 mt-4"
        style={{ borderTop: `0.5px solid ${THEME.muted}` }}
      />
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="mb-4 text-base leading-relaxed" style={{ color: THEME.fg }}>
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 space-y-2">{children}</ul>
          ),
          li: ({ children }) => (
            <li
              className="flex gap-3 text-sm leading-relaxed"
              style={{ color: THEME.fg }}
            >
              <span aria-hidden="true" className="mt-[0.4em] shrink-0 font-mono text-xs" style={{ color: THEME.muted }}>—</span>
              <span>{children}</span>
            </li>
          ),
          strong: ({ children }) => (
            <strong style={{ color: THEME.fg }}>{children}</strong>
          ),
          code: ({ children }) => (
            <code
              className="rounded px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em]"
              style={{ background: "rgba(0,0,0,0.2)", color: THEME.muted }}
            >
              {children}
            </code>
          ),
          h3: ({ children }) => (
            <h3
              className="mb-2 mt-6 font-mono text-[11px] uppercase tracking-[0.16em]"
              style={{ color: THEME.muted }}
            >
              {children}
            </h3>
          ),
          hr: () => null,
        }}
      >
        {body}
      </ReactMarkdown>
    </article>
  );
}

export default function BacklogPage() {
  const raw = readFileSync(join(process.cwd(), "BACKLOG.md"), "utf8");
  const sections = parseSections(raw);

  return (
    <main className="flex-1" style={{ background: UI.bg, color: UI.fg }}>
      <div className="mx-auto w-full max-w-2xl px-5 pt-6 pb-12 sm:px-8 sm:pt-8 sm:pb-16">
        <PageHeader title="Backlog" className="mb-10" />
        <div className="flex flex-col gap-6">
          {sections.map((s) => (
            <BacklogCard key={s.heading} heading={s.heading} status={s.status} body={s.body} />
          ))}
        </div>
      </div>
    </main>
  );
}
