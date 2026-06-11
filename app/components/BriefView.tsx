"use client";

import { useEffect, useRef, useState } from "react";
import type { FontFamily, SavedPairing, SpecimenMeta } from "@/lib/types";
import { fontStackByName, loadFontByName } from "@/lib/font-loader";
import {
  addPairings,
  clearPairings,
  loadPairings,
  removePairing,
  tagSpecimen,
} from "@/lib/pairings-store";
import ProgressPanel from "./ProgressPanel";
import SpecimenViewer from "./SpecimenViewer";

interface BriefViewProps {
  lockedFont: FontFamily | null;
  onClearLock: () => void;
  specimens: SpecimenMeta[];
  onGenerate: (
    display: string,
    text: string,
    brief?: string,
    paletteMood?: string,
  ) => Promise<SpecimenMeta | null>;
  onJobDone: () => void;
  onDeleted: (id: string) => void;
}

const PLACEHOLDER =
  "Fun and playful for a kids game show. Needs to work for big headlines and readable instructions.";

type PairingStatus = "idea" | "running" | "done" | "error";

export default function BriefView({
  lockedFont,
  onClearLock,
  specimens,
  onGenerate,
  onJobDone,
  onDeleted,
}: BriefViewProps) {
  const [brief, setBrief] = useState("");
  const [pairings, setPairings] = useState<SavedPairing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const autoFocused = useRef(false);

  // Hydrate the persisted pairing history on mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPairings(loadPairings());
  }, []);

  const specimenFor = (p: SavedPairing): SpecimenMeta | undefined =>
    p.specimenId ? specimens.find((s) => s.id === p.specimenId) : undefined;

  const statusOf = (p: SavedPairing): PairingStatus =>
    specimenFor(p)?.status ?? "idea";

  // Once specimens have loaded, focus an in-flight generation (if any) so
  // returning to Brief re-shows a job that's still running.
  useEffect(() => {
    if (autoFocused.current || specimens.length === 0) return;
    autoFocused.current = true;
    const running = pairings.find((p) => statusOf(p) === "running");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (running) setActiveId(running.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specimens, pairings]);

  const request = async (excludeShown: boolean) => {
    if (brief.trim().length < 3) {
      setError("Describe what you need first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const exclude = excludeShown
        ? pairings.map((p) => [p.display, p.text])
        : undefined;
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: brief.trim(),
          lockedFont: lockedFont?.family,
          exclude,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to get proposals");
      const updated = addPairings(
        data.proposals ?? [],
        brief.trim(),
        lockedFont?.family,
        new Date().toISOString(),
      );
      setPairings(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get proposals");
    } finally {
      setLoading(false);
    }
  };

  const generate = async (p: SavedPairing) => {
    const meta = await onGenerate(p.display, p.text, p.brief, p.paletteMood);
    if (meta) {
      // Tag the pairing and let its card flip to "View progress". We deliberately
      // do NOT open the log pane here — the user clicks "View progress" when they
      // want to watch, so starting a generation stays non-blocking.
      setPairings(tagSpecimen(p.id, meta.id));
    }
  };

  const remove = (p: SavedPairing) => {
    setPairings(removePairing(p.id));
    if (activeId === p.id) setActiveId(null);
  };

  const clearAll = () => {
    if (!confirm("Clear all saved pairings? Generated specimens stay in the library."))
      return;
    setPairings(clearPairings());
    setActiveId(null);
  };

  const activePairing = activeId
    ? pairings.find((p) => p.id === activeId) ?? null
    : null;
  const activeSpecimen = activePairing ? specimenFor(activePairing) : undefined;

  return (
    <div className="flex h-full flex-col">
      {/* Brief input */}
      <div className="border-b border-border px-6 py-5">
        {lockedFont && (
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs text-accent">
            Must include {lockedFont.family} as display
            <button onClick={onClearLock} className="text-accent/70 hover:text-accent">
              clear
            </button>
          </div>
        )}
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={3}
          className="w-full resize-none rounded border border-border bg-panel px-4 py-3 text-sm text-text outline-none placeholder:text-muted focus:border-accent"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => request(false)}
            disabled={loading}
            className="rounded bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Thinking…" : "Propose pairings"}
          </button>
          {error && <span className="text-sm text-bad">{error}</span>}
        </div>
      </div>

      {/* Workspace: optional left pane (active generation) + the pairing history */}
      <div className="flex min-h-0 flex-1">
        {activePairing && activeSpecimen && (
          <div className="flex w-1/2 min-w-0 flex-col border-r border-border">
            <div className="flex items-center justify-end border-b border-border px-3 py-2">
              <button
                onClick={() => setActiveId(null)}
                title="Close"
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded text-muted hover:bg-panel-2 hover:text-text"
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
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1">
              {activeSpecimen.status === "running" ? (
                <ProgressPanel
                  key={activeSpecimen.id}
                  meta={activeSpecimen}
                  onDone={onJobDone}
                />
              ) : activeSpecimen.status === "error" ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
                  <p className="max-w-sm text-center text-sm text-bad">
                    Generation failed: {activeSpecimen.error ?? "unknown error"}
                  </p>
                  <button
                    onClick={() => generate(activePairing)}
                    className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-bg hover:opacity-90"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <SpecimenViewer
                  meta={activeSpecimen}
                  onDeleted={(id) => {
                    onDeleted(id);
                    setActiveId(null);
                  }}
                />
              )}
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {pairings.length === 0 && !loading ? (
            <p className="py-12 text-center text-sm text-muted">
              Describe a need above to get pairing proposals. They are saved here so
              you can come back and generate any of them later.
            </p>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
                  {pairings.length} saved pairing{pairings.length === 1 ? "" : "s"}
                </span>
                {pairings.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-muted hover:text-bad"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div
                className={`grid gap-3 ${
                  activePairing
                    ? "grid-cols-1"
                    : "grid-cols-1 lg:grid-cols-2"
                }`}
              >
                {pairings.map((p) => (
                  <PairingCard
                    key={p.id}
                    pairing={p}
                    status={statusOf(p)}
                    active={p.id === activeId}
                    onGenerate={() => generate(p)}
                    onView={() => setActiveId(p.id)}
                    onRemove={() => remove(p)}
                  />
                ))}
              </div>
            </>
          )}

          {pairings.length > 0 && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => request(true)}
                disabled={loading}
                className="rounded border border-border bg-panel px-4 py-2 text-sm text-text hover:border-muted disabled:opacity-50"
              >
                {loading ? "Thinking…" : "More options"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PairingCard({
  pairing,
  status,
  active,
  onGenerate,
  onView,
  onRemove,
}: {
  pairing: SavedPairing;
  status: PairingStatus;
  active: boolean;
  onGenerate: () => void;
  onView: () => void;
  onRemove: () => void;
}) {
  useEffect(() => {
    loadFontByName(pairing.display);
    loadFontByName(pairing.text);
  }, [pairing.display, pairing.text]);

  return (
    <div
      className={`rounded border bg-panel p-5 transition-colors ${
        active ? "border-accent" : "border-border"
      }`}
    >
      {/* Compact identity pill — display first, text second (by convention), kept
          out of the sample flow so the faces can be judged on their own. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-muted">
          {pairing.display}
          <span className="opacity-50">/</span>
          {pairing.text}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={status} />
          <button
            onClick={onRemove}
            title="Remove from history"
            className="text-muted hover:text-bad"
          >
            ×
          </button>
        </div>
      </div>

      <div
        className="mt-4 text-3xl leading-tight text-text"
        style={{ fontFamily: fontStackByName(pairing.display) }}
      >
        {pairing.sampleHeadline || pairing.display}
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <p
          className="text-base leading-relaxed text-text"
          style={{ fontFamily: fontStackByName(pairing.text) }}
        >
          {pairing.sampleBody}
        </p>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted">{pairing.rationale}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-wide text-muted">
        <span className="text-accent-2">{pairing.paletteMood}</span>
        {pairing.brief && (
          <>
            <span aria-hidden>·</span>
            <span className="truncate">from: {pairing.brief}</span>
          </>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <PairingActions status={status} onGenerate={onGenerate} onView={onView} />
      </div>
    </div>
  );
}

function PairingActions({
  status,
  onGenerate,
  onView,
}: {
  status: PairingStatus;
  onGenerate: () => void;
  onView: () => void;
}) {
  if (status === "running") {
    return (
      <button
        onClick={onView}
        className="rounded bg-accent-2 px-3 py-1.5 text-sm font-medium text-bg hover:opacity-90"
      >
        View progress
      </button>
    );
  }
  if (status === "done") {
    return (
      <>
        <button
          onClick={onView}
          className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-bg hover:opacity-90"
        >
          View specimen
        </button>
        <button
          onClick={onGenerate}
          className="rounded px-3 py-1.5 text-sm text-muted hover:text-text"
        >
          Regenerate
        </button>
      </>
    );
  }
  if (status === "error") {
    return (
      <button
        onClick={onGenerate}
        className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-bg hover:opacity-90"
      >
        Retry
      </button>
    );
  }
  return (
    <button
      onClick={onGenerate}
      className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-bg hover:opacity-90"
    >
      Generate specimen
    </button>
  );
}

function StatusBadge({ status }: { status: PairingStatus }) {
  if (status === "idea") return null;
  const map: Record<Exclude<PairingStatus, "idea">, { label: string; cls: string }> = {
    running: { label: "generating", cls: "text-accent" },
    done: { label: "done", cls: "text-good" },
    error: { label: "error", cls: "text-bad" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`font-mono text-[10px] uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  );
}
