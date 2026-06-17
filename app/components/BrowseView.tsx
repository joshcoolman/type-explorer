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
import { PAGE_THEME, HIGHLIGHT } from "@/lib/card-themes";
import FontSpecimenCard from "./FontSpecimenCard";
import { useVoice } from "./VoiceProvider";
import { Button, Container, Grid, GridAlign, Input, PageHeader } from "./ui";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "serif", label: "Serif" },
  { key: "sans-serif", label: "Sans" },
  { key: "display", label: "Display" },
  { key: "monospace", label: "Mono" },
  { key: "handwriting", label: "Script" },
] as const;

const PAGE = 60;

/** Page-chrome surface colors, matching the rest of the app's dark surfaces. */
const UI = {
  bg: PAGE_THEME.bg,
  fg: PAGE_THEME.fg,
  muted: PAGE_THEME.muted,
  accent: PAGE_THEME.accent,
  border: "#2A2823",
  field: "#1B1A16",
  pill: "#1F1D19",
};

export default function BrowseView() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [category, setCategory] = useState<string>("all");

  const [families, setFamilies] = useState<FontFamily[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pairing library (lazy-loaded); gates the "Get Pairings" link per card.
  const [library, setLibrary] = useState<PairingLibrary | null>(null);

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
          sort: "popularity",
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
    [debouncedQ, category],
  );

  // Reset and refetch whenever the query parameters change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPage(0, true);
  }, [fetchPage]);

  const canLoadMore = families.length < total;

  return (
    <main className="flex-1" style={{ background: UI.bg, color: UI.fg }}>
      <Container className="pt-6 pb-12 sm:pt-8 sm:pb-16">
        <GridAlign className="mb-10">
          <PageHeader
            title="Fonts"
            className="mb-0"
            actions={
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search fonts"
                className="w-full sm:w-56"
                style={{
                  borderColor: UI.border,
                  background: UI.field,
                  color: UI.fg,
                }}
              />
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => {
                  const on = category === c.key;
                  return (
                    <Button
                      key={c.key}
                      size="sm"
                      onClick={() => setCategory(c.key)}
                      style={
                        on
                          ? { background: HIGHLIGHT, color: UI.bg }
                          : { background: UI.pill, color: UI.muted }
                      }
                    >
                      {c.label}
                    </Button>
                  );
                })}
              </div>
            </div>
            }
          />
        </GridAlign>

        {error && (
          <div
            className="mb-6 rounded-card border px-4 py-3 text-sm"
            style={{
              borderColor: "rgba(240,138,138,0.4)",
              background: "rgba(240,138,138,0.1)",
              color: "#F08A8A",
            }}
          >
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
            />
          ))}
        </Grid>

        {!loading && families.length === 0 && (
          <p className="py-12 text-center text-sm" style={{ color: UI.muted }}>
            No fonts match these filters.
          </p>
        )}

        {canLoadMore && (
          <div className="mt-8 flex justify-center">
            <Button
              onClick={() => fetchPage(offset + PAGE, false)}
              disabled={loading}
              className="border"
              style={{
                borderColor: UI.border,
                background: UI.field,
                color: UI.fg,
              }}
            >
              {loading ? "Loading…" : `Load more (${families.length} of ${total})`}
            </Button>
          </div>
        )}
      </Container>
    </main>
  );
}
