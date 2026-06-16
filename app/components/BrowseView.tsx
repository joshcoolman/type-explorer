"use client";

import { useCallback, useEffect, useState } from "react";
import type { FontFamily } from "@/lib/types";
import {
  useFavorites,
  isFontFavorite,
  toggleFontFavorite,
} from "@/lib/favorites";
import {
  loadPairingLibrary,
  type PairingLibrary,
} from "@/lib/pairing-library";
import FontSpecimenCard from "./FontSpecimenCard";
import SuggestedPairingsModal from "./SuggestedPairingsModal";
import { useVoice } from "./VoiceProvider";
import { Button, Grid, Input } from "./ui";

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

export default function BrowseView() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("popularity");

  const [families, setFamilies] = useState<FontFamily[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pairing library (lazy-loaded) + which source font's pairings are open.
  const [library, setLibrary] = useState<PairingLibrary | null>(null);
  const [pairingFor, setPairingFor] = useState<string | null>(null);

  const favorites = useFavorites();
  const { voice } = useVoice();

  // Pull in the pairing library once; the magic icon appears as it resolves.
  useEffect(() => {
    loadPairingLibrary().then(setLibrary).catch(() => setLibrary({}));
  }, []);

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

  const canLoadMore = families.length < total;

  return (
    <div className="flex h-full flex-col">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-4">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search fonts"
          className="w-56 border-border bg-panel text-text placeholder:text-muted focus:border-accent"
        />
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((c) => (
            <Button
              key={c.key}
              size="sm"
              onClick={() => setCategory(c.key)}
              className={
                category === c.key
                  ? "bg-accent text-bg"
                  : "bg-panel text-muted hover:text-text"
              }
            >
              {c.label}
            </Button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          {SORTS.map((s) => (
            <Button
              key={s.key}
              size="sm"
              onClick={() => setSort(s.key)}
              className={
                sort === s.key
                  ? "bg-panel-2 text-text"
                  : "text-muted hover:text-text"
              }
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {error && (
          <div className="mb-4 rounded-card border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">
            {error}
          </div>
        )}
        <Grid>
          {families.map((f, i) => (
            <FontSpecimenCard
              key={f.family}
              family={f}
              index={i}
              voice={voice}
              favorited={isFontFavorite(favorites, f.family)}
              onToggleFavorite={() => toggleFontFavorite(f)}
              hasPairings={!!library?.[f.family]}
              onShowPairings={() => setPairingFor(f.family)}
            />
          ))}
        </Grid>

        {!loading && families.length === 0 && (
          <p className="py-12 text-center text-sm text-muted">
            No fonts match these filters.
          </p>
        )}

        {canLoadMore && (
          <div className="mt-6 flex justify-center">
            <Button
              onClick={() => fetchPage(offset + PAGE, false)}
              disabled={loading}
              className="border border-border bg-panel text-text hover:border-muted"
            >
              {loading ? "Loading…" : `Load more (${families.length} of ${total})`}
            </Button>
          </div>
        )}
      </div>

      {pairingFor && library?.[pairingFor] && (
        <SuggestedPairingsModal
          source={pairingFor}
          entry={library[pairingFor]}
          onClose={() => setPairingFor(null)}
        />
      )}
    </div>
  );
}
