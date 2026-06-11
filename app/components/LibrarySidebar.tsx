"use client";

import { useState } from "react";
import type { SpecimenMeta } from "@/lib/types";
import { fmtCost, fmtDuration } from "@/lib/format";

interface LibrarySidebarProps {
  specimens: SpecimenMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
}

const STATUS_LABEL: Record<SpecimenMeta["status"], string> = {
  running: "running",
  done: "done",
  error: "error",
};

export default function LibrarySidebar({
  specimens,
  activeId,
  onSelect,
  onRefresh,
}: LibrarySidebarProps) {
  const [refreshing, setRefreshing] = useState(false);

  const refreshCatalog = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/fonts/refresh", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Catalog refresh failed");
      }
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-panel">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Library
        </span>
        <button
          onClick={onRefresh}
          className="text-xs text-muted hover:text-text"
          title="Reload specimen list"
        >
          reload
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {specimens.length === 0 ? (
          <p className="px-4 py-6 text-xs leading-relaxed text-muted">
            No specimens yet. Pick a pairing in Browse or Brief, then generate one.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {specimens.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => onSelect(s.id)}
                  className={`block w-full px-4 py-3 text-left transition-colors ${
                    activeId === s.id ? "bg-panel-2" : "hover:bg-panel-2/60"
                  }`}
                >
                  <span className="block truncate text-sm text-text">
                    {s.title}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 font-mono text-[10px] uppercase tracking-wide text-muted">
                    <StatusBadge status={s.status} label={STATUS_LABEL[s.status]} />
                    {fmtDuration(s.durationMs) && <span>{fmtDuration(s.durationMs)}</span>}
                    {fmtCost(s.costUsd) && <span>{fmtCost(s.costUsd)}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-border px-4 py-3">
        <button
          onClick={refreshCatalog}
          disabled={refreshing}
          className="w-full rounded border border-border px-3 py-1.5 text-xs text-muted hover:text-text disabled:opacity-50"
        >
          {refreshing ? "Refreshing catalog…" : "Refresh font catalog"}
        </button>
      </div>
    </aside>
  );
}

function StatusBadge({
  status,
  label,
}: {
  status: SpecimenMeta["status"];
  label: string;
}) {
  const color =
    status === "done"
      ? "text-good"
      : status === "error"
        ? "text-bad"
        : "text-accent";
  return <span className={color}>{label}</span>;
}
