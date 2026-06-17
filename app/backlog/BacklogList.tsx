"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { PageHeader } from "../components/ui";
import { PAGE_THEME } from "../../lib/card-themes";
import type { BacklogSection } from "./page";

const UI = { bg: PAGE_THEME.bg, fg: PAGE_THEME.fg, muted: PAGE_THEME.muted };
const THEME = { bg: "#40534C", fg: "#F0E4D3", muted: "#AEBAB0" };

function BacklogCard({
  heading,
  body,
  expanded,
  onToggle,
}: {
  heading: string;
  status: string | null;
  body: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <article
      className="rounded-2xl"
      style={{ background: THEME.bg, color: THEME.fg }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-8 py-5 text-left transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/30 sm:px-10"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold leading-snug" style={{ color: THEME.fg }}>
            {heading}
          </h2>
        </div>
        <span
          className="shrink-0 font-mono text-[11px] uppercase tracking-[0.16em] transition-transform duration-200"
          style={{
            color: THEME.muted,
            transform: expanded ? "rotate(180deg)" : "none",
          }}
          aria-hidden="true"
        >
          ↓
        </span>
      </button>

      {expanded && (
        <div className="px-8 pb-8 sm:px-10 sm:pb-10">
          <div
            className="mb-6"
            style={{ borderTop: `0.5px solid ${THEME.muted}` }}
          />
          <h2 className="mb-6 text-3xl font-bold leading-[1.05] sm:text-4xl">
            {heading}
          </h2>
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
                <li className="flex gap-3 text-sm leading-relaxed" style={{ color: THEME.fg }}>
                  <span
                    aria-hidden="true"
                    className="mt-[0.4em] shrink-0 font-mono text-xs"
                    style={{ color: THEME.muted }}
                  >
                    —
                  </span>
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
        </div>
      )}
    </article>
  );
}

export default function BacklogList({ sections }: { sections: BacklogSection[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (heading: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(heading) ? next.delete(heading) : next.add(heading);
      return next;
    });

  return (
    <main className="flex-1" style={{ background: UI.bg, color: UI.fg }}>
      <div className="mx-auto w-full max-w-2xl px-5 pt-6 pb-12 sm:px-8 sm:pt-8 sm:pb-16">
        <PageHeader title="Backlog" className="mb-10" />
        <div className="flex flex-col gap-3">
          {sections.map((s) => (
            <BacklogCard
              key={s.heading}
              heading={s.heading}
              status={s.status}
              body={s.body}
              expanded={expanded.has(s.heading)}
              onToggle={() => toggle(s.heading)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
