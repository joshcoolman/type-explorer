"use client";

import { useCallback, useEffect, useState } from "react";
import type { FontFamily } from "@/lib/types";
import FontCard from "./FontCard";

type SortKey = "popularity" | "trending" | "date" | "alpha";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "serif", label: "Serif" },
  { key: "sans-serif", label: "Sans" },
  { key: "display", label: "Display" },
  { key: "monospace", label: "Mono" },
  { key: "handwriting", label: "Script" },
] as const;

const SORTS: { key: SortKey; label: string }[] = [
  { key: "popularity", label: "Popular" },
  { key: "trending", label: "Trending" },
  { key: "date", label: "Updated" },
  { key: "alpha", label: "A–Z" },
];

const PAGE = 60;

interface BrowseViewProps {
  selected: FontFamily[];
  onToggleSelect: (family: FontFamily) => void;
  onFindPartner: (family: FontFamily) => void;
  onGenerate: (display: FontFamily, text: FontFamily) => void;
}

export default function BrowseView({
  selected,
  onToggleSelect,
  onFindPartner,
  onGenerate,
}: BrowseViewProps) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("popularity");

  const [families, setFamilies] = useState<FontFamily[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const fetchPage = useCallback(
    async (nextOffset: number, replace: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          q: debouncedQ,
          category,
          sort,
          limit: String(PAGE),
          offset: String(nextOffset),
        });
        const res = await fetch(`/api/fonts?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load fonts");
        setTotal(data.total);
        setOffset(nextOffset);
        setFamilies((prev) =>
          replace ? data.families : [...prev, ...data.families],
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load fonts");
      } finally {
        setLoading(false);
      }
    },
    [debouncedQ, category, sort],
  );

  // Reset and refetch whenever the query parameters change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPage(0, true);
  }, [fetchPage]);

  const selectedKeys = new Set(selected.map((f) => f.family));
  const canLoadMore = families.length < total;

  const roleHint =
    selected.length === 2
      ? guessRoles(selected[0], selected[1])
      : null;

  return (
    <div className="flex h-full flex-col">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search fonts"
          className="w-56 rounded border border-border bg-panel px-3 py-1.5 text-sm text-text outline-none placeholder:text-muted focus:border-accent"
        />
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                category === c.key
                  ? "bg-accent text-bg"
                  : "bg-panel text-muted hover:text-text"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                sort === s.key
                  ? "bg-panel-2 text-text"
                  : "text-muted hover:text-text"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {error && (
          <div className="mb-4 rounded border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {families.map((f) => {
            const idx = selected.findIndex((s) => s.family === f.family);
            return (
              <FontCard
                key={f.family}
                family={f}
                selected={selectedKeys.has(f.family)}
                selectionIndex={idx}
                sort={sort}
                onToggle={onToggleSelect}
              />
            );
          })}
        </div>

        {!loading && families.length === 0 && (
          <p className="py-12 text-center text-sm text-muted">
            No fonts match these filters.
          </p>
        )}

        {canLoadMore && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => fetchPage(offset + PAGE, false)}
              disabled={loading}
              className="rounded border border-border bg-panel px-4 py-2 text-sm text-text hover:border-muted disabled:opacity-50"
            >
              {loading ? "Loading…" : `Load more (${families.length} of ${total})`}
            </button>
          </div>
        )}
      </div>

      {/* Selection action bar */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 border-t border-border bg-panel px-6 py-3">
          <span className="text-sm text-muted">
            {selected.length === 1
              ? `Selected: ${selected[0].family}`
              : `${selected[0].family} + ${selected[1].family}`}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {selected.length === 1 && (
              <button
                onClick={() => onFindPartner(selected[0])}
                className="rounded bg-accent-2 px-3 py-1.5 text-sm font-medium text-bg hover:opacity-90"
              >
                Find a partner
              </button>
            )}
            {selected.length === 2 && roleHint && (
              <button
                onClick={() => onGenerate(roleHint.display, roleHint.text)}
                className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-bg hover:opacity-90"
              >
                Generate specimen ({roleHint.display.family} as display)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Guess which font is the display face: prefer the display/handwriting-category one. */
function guessRoles(a: FontFamily, b: FontFamily): {
  display: FontFamily;
  text: FontFamily;
} {
  const displayish = (f: FontFamily) =>
    f.category === "display" || f.category === "handwriting";
  if (displayish(a) && !displayish(b)) return { display: a, text: b };
  if (displayish(b) && !displayish(a)) return { display: b, text: a };
  // Otherwise the first-selected is display.
  return { display: a, text: b };
}
