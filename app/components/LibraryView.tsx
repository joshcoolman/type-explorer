"use client";

import { useEffect, useRef, useState } from "react";
import type { ProgressEvent, SpecimenMeta } from "@/lib/types";
import { fmtCost, fmtDuration } from "@/lib/format";

interface LibraryViewProps {
  specimens: SpecimenMeta[];
  activeId: string | null;
  onJobDone: () => void;
  onDeleted: (id: string) => void;
}

export default function LibraryView({
  specimens,
  activeId,
  onJobDone,
  onDeleted,
}: LibraryViewProps) {
  const active = specimens.find((s) => s.id === activeId) ?? null;

  if (!active) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <p className="max-w-md text-center text-sm text-muted">
          Select a specimen from the library, or generate one from Browse or Brief.
        </p>
      </div>
    );
  }

  if (active.status === "running") {
    return <ProgressPanel key={active.id} meta={active} onDone={onJobDone} />;
  }

  if (active.status === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
        <p className="max-w-lg text-center text-sm text-bad">
          {active.title} failed: {active.error ?? "unknown error"}
        </p>
        <DeleteButton id={active.id} onDeleted={onDeleted} />
      </div>
    );
  }

  return <SpecimenViewer meta={active} onDeleted={onDeleted} />;
}

function ProgressPanel({
  meta,
  onDone,
}: {
  meta: SpecimenMeta;
  onDone: () => void;
}) {
  const [status, setStatus] = useState("Starting…");
  const [lines, setLines] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startRef = useRef(0);

  useEffect(() => {
    startRef.current = Date.now();
    const t = setInterval(() => {
      setElapsed(Math.round((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const es = new EventSource(`/api/jobs/${meta.id}/events`);
    es.onmessage = (e) => {
      const ev = JSON.parse(e.data) as ProgressEvent;
      switch (ev.type) {
        case "status":
          setStatus(ev.text);
          break;
        case "tool":
          setLines((prev) =>
            [...prev, `→ ${ev.tool}${ev.detail ? `  ${ev.detail}` : ""}`].slice(-200),
          );
          break;
        case "thinking":
        case "text":
          setLines((prev) => {
            // Append to the running narration line to avoid token-by-token spam.
            const last = prev[prev.length - 1] ?? "";
            if (last.startsWith("•")) {
              return [...prev.slice(0, -1), (last + ev.text).slice(-2000)];
            }
            return [...prev, `• ${ev.text}`].slice(-200);
          });
          break;
        case "done":
          es.close();
          onDone();
          break;
      }
    };
    es.onerror = () => {
      es.close();
      // The job may have finished between the list snapshot and now.
      onDone();
    };
    return () => es.close();
  }, [meta.id, onDone]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg text-text">{meta.title}</h2>
        <div className="mt-1 flex items-center gap-3 font-mono text-xs text-muted">
          <span className="text-accent">{status}</span>
          <span>·</span>
          <span>{elapsed}s</span>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-6 py-4 font-mono text-xs leading-relaxed text-muted"
      >
        {lines.length === 0 ? (
          <p className="text-muted">Waiting for the agent…</p>
        ) : (
          lines.map((l, i) => (
            <p key={i} className="whitespace-pre-wrap break-words">
              {l}
            </p>
          ))
        )}
      </div>
    </div>
  );
}

function SpecimenViewer({
  meta,
  onDeleted,
}: {
  meta: SpecimenMeta;
  onDeleted: (id: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-3">
        <h2 className="text-sm text-text">{meta.title}</h2>
        <span className="flex items-center gap-2 font-mono text-[11px] text-muted">
          {fmtDuration(meta.durationMs) && <span>{fmtDuration(meta.durationMs)}</span>}
          {fmtCost(meta.costUsd) && <span>{fmtCost(meta.costUsd)}</span>}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <a
            href={`/api/specimens/${meta.id}`}
            target="_blank"
            rel="noreferrer"
            className="rounded border border-border px-3 py-1.5 text-xs text-text hover:border-muted"
          >
            Open raw
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

function DeleteButton({
  id,
  onDeleted,
}: {
  id: string;
  onDeleted: (id: string) => void;
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
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
