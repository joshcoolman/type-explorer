"use client";

import { useState } from "react";
import type { SpecimenMeta } from "@/lib/types";
import { fmtCost, fmtDuration } from "@/lib/format";

/**
 * Renders a finished specimen in a sandboxed iframe with open-in-new-tab,
 * download, and delete actions. `allow-scripts` is required (the specimen's axis
 * sliders, tester, and theme toggle are interactive); there is no
 * `allow-same-origin`, so scripts run in an opaque origin. Used by both the
 * Library and the Brief split-pane.
 */
export default function SpecimenViewer({
  meta,
  onDeleted,
}: {
  meta: SpecimenMeta;
  onDeleted: (id: string) => void;
}) {
  const fileName = `${slug(meta.title)}-specimen.html`;
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-3">
        <h2 className="text-sm text-text">{meta.title}</h2>
        <span className="flex items-center gap-2 font-mono text-[11px] text-muted">
          {fmtDuration(meta.durationMs) && <span>{fmtDuration(meta.durationMs)}</span>}
          {fmtCost(meta.costUsd) && <span>{fmtCost(meta.costUsd)}</span>}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <a
            href={`/api/specimens/${meta.id}`}
            target="_blank"
            rel="noreferrer"
            title="Open in new tab"
            aria-label="Open in new tab"
            className="flex h-8 w-8 items-center justify-center rounded border border-border text-muted hover:border-muted hover:text-text"
          >
            <NewTabIcon />
          </a>
          <a
            href={`/api/specimens/${meta.id}`}
            download={fileName}
            title="Download HTML"
            aria-label="Download HTML"
            className="flex h-8 w-8 items-center justify-center rounded border border-border text-muted hover:border-muted hover:text-text"
          >
            <DownloadIcon />
          </a>
          <DeleteButton id={meta.id} onDeleted={onDeleted} />
        </div>
      </div>
      <iframe
        key={meta.id}
        src={`/api/specimens/${meta.id}`}
        sandbox="allow-scripts allow-popups"
        className="min-h-0 flex-1 border-0 bg-white"
        title={meta.title}
      />
    </div>
  );
}

/** Slugify a title into a safe filename stem (e.g. "Fraunces × Libre Franklin"). */
function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function NewTabIcon() {
  return (
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
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

function DownloadIcon() {
  return (
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

export function DeleteButton({
  id,
  onDeleted,
  label = "Delete",
}: {
  id: string;
  onDeleted: (id: string) => void;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => {
        if (!confirm("Delete this specimen?")) return;
        setBusy(true);
        try {
          const res = await fetch(`/api/specimens/${id}`, { method: "DELETE" });
          if (res.ok) onDeleted(id);
        } finally {
          setBusy(false);
        }
      }}
      disabled={busy}
      className="rounded border border-bad/40 px-3 py-1.5 text-xs text-bad hover:bg-bad/10 disabled:opacity-50"
    >
      {busy ? "Deleting…" : label}
    </button>
  );
}
