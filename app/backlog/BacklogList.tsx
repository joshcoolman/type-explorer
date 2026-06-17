"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button, PageHeader } from "../components/ui";
import { PAGE_THEME, HIGHLIGHT } from "../../lib/card-themes";
import type { BacklogSection } from "./page";

const UI = { bg: PAGE_THEME.bg, fg: PAGE_THEME.fg, muted: PAGE_THEME.muted };

interface CardTheme {
  bg: string;
  fg: string;
  muted: string;
}

/** Open ideas wear the forest-roast green; shipped/closed wear the darker blue. */
const OPEN_THEME: CardTheme = { bg: "#40534C", fg: "#F0E4D3", muted: "#AEBAB0" };
const CLOSED_THEME: CardTheme = { bg: "#2E434F", fg: "#DEE6EA", muted: "#93AAB6" };

function BacklogCard({
  heading,
  body,
  theme,
  expanded,
  onToggle,
}: {
  heading: string;
  status: string | null;
  body: string;
  theme: CardTheme;
  expanded: boolean;
  onToggle: () => void;
}) {
  const THEME = theme;
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
  const [view, setView] = useState<"open" | "closed">("open");

  const toggle = (heading: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(heading) ? next.delete(heading) : next.add(heading);
      return next;
    });

  const openCount = sections.filter((s) => !s.closed).length;
  const closedCount = sections.length - openCount;
  const visible = sections.filter((s) => (view === "closed" ? s.closed : !s.closed));

  const PILLS = [
    { key: "open", label: "Open", count: openCount },
    { key: "closed", label: "Closed", count: closedCount },
  ] as const;

  return (
    <main className="flex-1" style={{ background: UI.bg, color: UI.fg }}>
      <div className="mx-auto w-full max-w-2xl px-5 pt-6 pb-12 sm:px-8 sm:pt-8 sm:pb-16">
        <PageHeader title="Backlog" className="mb-8" />

        <div className="mb-8 flex gap-1.5">
          {PILLS.map((p) => {
            const on = view === p.key;
            return (
              <Button
                key={p.key}
                size="sm"
                onClick={() => setView(p.key)}
                style={
                  on
                    ? { background: HIGHLIGHT, color: UI.bg }
                    : { background: "#1F1D19", color: UI.muted }
                }
              >
                {p.label}
                <span className="ml-1.5 opacity-60">{p.count}</span>
              </Button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          {visible.map((s) => (
            <BacklogCard
              key={s.heading}
              heading={s.heading}
              status={s.status}
              body={s.body}
              theme={s.closed ? CLOSED_THEME : OPEN_THEME}
              expanded={expanded.has(s.heading)}
              onToggle={() => toggle(s.heading)}
            />
          ))}
          {visible.length === 0 && (
            <p className="py-8 text-center text-sm" style={{ color: UI.muted }}>
              No {view} items.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
