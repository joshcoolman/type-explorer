"use client";

import { useEffect, useState } from "react";
import type { FontFamily, PairingProposal } from "@/lib/types";
import { fontStackByName, loadFontByName } from "@/lib/font-loader";

interface BriefViewProps {
  lockedFont: FontFamily | null;
  onClearLock: () => void;
  onGenerate: (
    display: string,
    text: string,
    brief?: string,
    paletteMood?: string,
  ) => void;
}

const PLACEHOLDER =
  "Fun and playful for a kids game show. Needs to work for big headlines and readable instructions.";

export default function BriefView({
  lockedFont,
  onClearLock,
  onGenerate,
}: BriefViewProps) {
  const [brief, setBrief] = useState("");
  const [proposals, setProposals] = useState<PairingProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const request = async (excludeShown: boolean) => {
    if (brief.trim().length < 3) {
      setError("Describe what you need first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const exclude = excludeShown
        ? proposals.map((p) => [p.display, p.text])
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
      const next: PairingProposal[] = data.proposals ?? [];
      setProposals((prev) => (excludeShown ? [...prev, ...next] : next));
      setDismissed(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get proposals");
    } finally {
      setLoading(false);
    }
  };

  const visible = proposals.filter((p) => !dismissed.has(`${p.display}|${p.text}`));

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col">
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

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {visible.length === 0 && !loading && (
          <p className="py-12 text-center text-sm text-muted">
            Describe a need above to get pairing proposals rendered in the real fonts.
          </p>
        )}

        <div className="space-y-4">
          {visible.map((p) => (
            <ProposalCard
              key={`${p.display}|${p.text}`}
              proposal={p}
              onGenerate={() =>
                onGenerate(p.display, p.text, brief.trim(), p.paletteMood)
              }
              onDismiss={() =>
                setDismissed((prev) => new Set(prev).add(`${p.display}|${p.text}`))
              }
            />
          ))}
        </div>

        {proposals.length > 0 && (
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
  );
}

function ProposalCard({
  proposal,
  onGenerate,
  onDismiss,
}: {
  proposal: PairingProposal;
  onGenerate: () => void;
  onDismiss: () => void;
}) {
  useEffect(() => {
    loadFontByName(proposal.display);
    loadFontByName(proposal.text);
  }, [proposal.display, proposal.text]);

  return (
    <div className="rounded border border-border bg-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className="text-4xl leading-tight text-text"
            style={{ fontFamily: fontStackByName(proposal.display) }}
          >
            {proposal.sampleHeadline || proposal.display}
          </div>
          <div className="mt-1 font-mono text-[11px] uppercase tracking-wide text-muted">
            {proposal.display} <span className="text-accent">/ display</span>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-accent-2">
          {proposal.paletteMood}
        </span>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <p
          className="text-lg leading-relaxed text-text"
          style={{ fontFamily: fontStackByName(proposal.text) }}
        >
          {proposal.sampleBody}
        </p>
        <div className="mt-1 font-mono text-[11px] uppercase tracking-wide text-muted">
          {proposal.text} <span className="text-accent">/ text</span>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted">{proposal.rationale}</p>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={onGenerate}
          className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-bg hover:opacity-90"
        >
          Generate specimen
        </button>
        <button
          onClick={onDismiss}
          className="rounded px-3 py-1.5 text-sm text-muted hover:text-text"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
