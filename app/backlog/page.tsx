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

const UI = {
  bg: PAGE_THEME.bg,
  fg: PAGE_THEME.fg,
  muted: PAGE_THEME.muted,
  accent: PAGE_THEME.accent,
  border: "#2A2823",
};

export default function BacklogPage() {
  const raw = readFileSync(join(process.cwd(), "BACKLOG.md"), "utf8");

  return (
    <main className="flex-1" style={{ background: UI.bg, color: UI.fg }}>
      <div className="mx-auto w-full max-w-2xl px-5 pt-6 pb-12 sm:px-8 sm:pt-8 sm:pb-16">
        <PageHeader title="Backlog" className="mb-10" />
        <div className="prose-backlog">
          <ReactMarkdown
            components={{
              h1: () => null,
              h2: ({ children }) => (
                <h2
                  className="mb-3 mt-10 text-xl font-semibold leading-snug first:mt-0"
                  style={{ color: UI.fg }}
                >
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3
                  className="mb-2 mt-6 text-base font-semibold"
                  style={{ color: UI.fg }}
                >
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p
                  className="mb-4 text-sm leading-relaxed"
                  style={{ color: UI.muted }}
                >
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="mb-4 space-y-1 pl-4">{children}</ul>
              ),
              li: ({ children }) => (
                <li
                  className="text-sm leading-relaxed"
                  style={{ color: UI.muted }}
                >
                  {children}
                </li>
              ),
              strong: ({ children }) => (
                <strong style={{ color: UI.fg }}>{children}</strong>
              ),
              code: ({ children }) => (
                <code
                  className="rounded px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em]"
                  style={{
                    background: UI.border,
                    color: UI.accent,
                  }}
                >
                  {children}
                </code>
              ),
              hr: () => (
                <hr
                  className="my-8"
                  style={{ borderColor: UI.border }}
                />
              ),
            }}
          >
            {raw}
          </ReactMarkdown>
        </div>
      </div>
    </main>
  );
}
