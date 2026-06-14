"use client";

import { useState } from "react";
import type { SpecimenMeta } from "@/lib/types";
import type { SpecimenControl } from "@/lib/specimen-control";
import SpecimenCard from "./SpecimenCard";
import SpecimenViewer from "./SpecimenViewer";

/**
 * Card / gallery view. The sidebar is hidden (the host collapses it); finished
 * specimens render as in-context preview tiles. Clicking a tile opens the full
 * specimen with a Back control. A light/dark toggle here flips every tile at
 * once through the shared control channel.
 */
export default function GridView({
  specimens,
  control,
  onSetMode,
  onDeleted,
}: {
  specimens: SpecimenMeta[];
  control: SpecimenControl;
  onSetMode: (mode: "light" | "dark") => void;
  onDeleted: (id: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const done = specimens.filter((s) => s.status === "done");
  const expanded = expandedId
    ? specimens.find((s) => s.id === expandedId) ?? null
    : null;

  if (expanded && expanded.status === "done") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center border-b border-border px-4 py-2">
          <button
            onClick={() => setExpandedId(null)}
            className="flex items-center gap-2 rounded px-2 py-1 text-sm text-muted hover:bg-panel-2 hover:text-text"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Back to grid
          </button>
        </div>
        <div className="min-h-0 flex-1">
          <SpecimenViewer
            meta={expanded}
            control={control}
            onDeleted={(id) => {
              onDeleted(id);
              setExpandedId(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-6 py-3">
        <span className="font-mono text-xs uppercase tracking-wide text-muted">
          {done.length} {done.length === 1 ? "specimen" : "specimens"}
        </span>
        <div className="ml-auto">
          <ModeToggle mode={control.mode} onSetMode={onSetMode} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        {done.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">
            No finished specimens yet. Generate one from Browse or Brief.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {done.map((s) => (
              <SpecimenCard
                key={s.id}
                meta={s}
                control={control}
                onOpen={setExpandedId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Segmented light / dark switch driving the whole grid. */
function ModeToggle({
  mode,
  onSetMode,
}: {
  mode: "light" | "dark";
  onSetMode: (mode: "light" | "dark") => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded border border-border font-mono text-[11px] uppercase tracking-wide">
      {(["light", "dark"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onSetMode(m)}
          className={`px-3 py-1.5 transition-colors ${
            mode === m
              ? "bg-panel-2 text-text"
              : "text-muted hover:text-text"
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
