"use client";

import { useEffect, useRef, useState } from "react";
import type { ProgressEvent, SpecimenMeta } from "@/lib/types";

/**
 * Live generation progress for one job: a status headline, an elapsed timer, and
 * a streamed log of the agent's narration and tool calls. Subscribes to the job's
 * SSE endpoint; calls `onDone` when the job finishes (or the stream drops).
 * Used by both the Library and the Brief split-pane.
 */
export default function ProgressPanel({
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
