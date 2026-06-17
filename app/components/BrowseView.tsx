"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { feelingFromSlug, feelingLabel, feelingSlug } from "@/lib/feelings";
import CategoryTiles from "./CategoryTiles";
import FontSpecimenCard from "./FontSpecimenCard";
import { useVoice } from "./VoiceProvider";
import { Button, Container, Grid, GridAlign, Input, PageHeader } from "./ui";

const PAGE = 60;

/**
 * A per-tab snapshot of the browse state, so returning from a pairing page (or
 * any navigation away) lands you back where you were instead of at the top of a
 * freshly-reset grid. We persist the filters and how many cards were loaded
 * (the scroll target won't exist until those are restored) alongside the scroll
 * offset. sessionStorage keeps it scoped to the tab and read post-mount, so no
 * SSR/hydration mismatch.
 */
interface BrowseSnapshot {
  q: string;
  category: string;
  loaded: number;
  scrollY: number;
}

const SESSION_KEY = "type-explorer:browse";

function readBrowseSnapshot(): BrowseSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<BrowseSnapshot>;
    if (typeof s.q !== "string" || typeof s.category !== "string") return null;
    return {
      q: s.q,
      category: s.category,
      loaded: typeof s.loaded === "number" && s.loaded > 0 ? s.loaded : PAGE,
      scrollY: typeof s.scrollY === "number" ? s.scrollY : 0,
    };
  } catch {
    return null;
  }
}

function writeBrowseSnapshot(s: BrowseSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    /* sessionStorage unavailable (private mode, quota) — non-fatal */
  }
}

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
  // The active feeling filter lives on the URL (?tag=cute) — shareable, and a tag
  // pill anywhere (including the pairings page) can deep-link into a focused view.
  const searchParams = useSearchParams();
  // useMemo so `tag` is a compiler-trackable dependency of fetchPage (a plain
  // derived local trips react-hooks/preserve-manual-memoization).
  const tag = useMemo(
    () => feelingFromSlug(searchParams.get("tag") ?? ""),
    [searchParams],
  );

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

  // --- Browse-state restoration ----------------------------------------------
  // Read once after mount (not during render, to avoid a hydration mismatch).
  // pendingRestore drives the first fetch to load the saved page count; the
  // refs hold the target values so the live "save" effects below can't clobber
  // them before the restore completes.
  const [hydrated, setHydrated] = useState(false);
  const pendingRestore = useRef<BrowseSnapshot | null>(null);
  const restoreScrollY = useRef<number | null>(null);
  // Single in-memory source of truth for the persisted snapshot, so the
  // filters/count save and the scroll save each touch only their own fields
  // (a filter change must not stamp a stale scrollY over the real one).
  const snap = useRef<BrowseSnapshot>({
    q: "",
    category: "all",
    loaded: 0,
    scrollY: 0,
  });

  useEffect(() => {
    const saved = readBrowseSnapshot();
    if (saved) {
      pendingRestore.current = saved;
      restoreScrollY.current = saved.scrollY;
      snap.current = saved;
      // Restoring persisted browse state into React state on mount — the one-shot
      // hydration the set-state-in-effect rule doesn't account for.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQ(saved.q);
      setDebouncedQ(saved.q);
      setCategory(saved.category);
    }
    setHydrated(true);
  }, []);

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
    async (nextOffset: number, replace: boolean, count?: number) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          q: debouncedQ,
          category,
          sort: "popularity",
          limit: String(count ?? PAGE),
          offset: String(nextOffset),
        });
        if (tag) params.set("tag", feelingSlug(tag));
        const res = await fetch(`/api/fonts?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load fonts");
        setTotal(data.total);
        // On a restore we fetch many cards at once; point `offset` at the last
        // page so the next "load more" continues from the restored count.
        setOffset(count ? Math.max(0, data.families.length - PAGE) : nextOffset);
        setFamilies((prev) =>
          replace ? data.families : [...prev, ...data.families],
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load fonts");
      } finally {
        setLoading(false);
      }
    },
    [debouncedQ, category, tag],
  );

  // Reset and refetch whenever the query parameters change (after hydration).
  // The first run consumes a pending restore to reload the saved page count.
  useEffect(() => {
    if (!hydrated) return;
    const snap = pendingRestore.current;
    pendingRestore.current = null;
    if (snap && snap.q === debouncedQ && snap.category === category) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchPage(0, true, snap.loaded);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchPage(0, true);
    }
  }, [hydrated, fetchPage]);

  // Once the restored cards have rendered, jump back to the saved scroll
  // position. Two frames so layout (and reserved card heights) has settled.
  useEffect(() => {
    if (restoreScrollY.current == null || families.length === 0) return;
    const y = restoreScrollY.current;
    restoreScrollY.current = null;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => window.scrollTo(0, y)),
    );
  }, [families]);

  // Keep the snapshot's filters/count current (scroll field left untouched).
  useEffect(() => {
    if (!hydrated) return;
    snap.current = { ...snap.current, q: debouncedQ, category, loaded: families.length };
    writeBrowseSnapshot(snap.current);
  }, [hydrated, debouncedQ, category, families.length]);

  // Persist scroll position (throttled to a frame) so "back" returns here. The
  // forward "Get Pairings" link uses scroll={false}, so navigating away never
  // resets the page to the top — this only ever records real user scrolling.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        snap.current = { ...snap.current, scrollY: window.scrollY };
        writeBrowseSnapshot(snap.current);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

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
              {tag && (
                <Link
                  href="/"
                  aria-label={`Clear ${feelingLabel(tag)} filter`}
                  className="inline-flex items-center gap-1.5 self-start rounded-[8px] px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80 sm:self-auto"
                  style={{ background: HIGHLIGHT, color: UI.bg }}
                >
                  Feeling: {feelingLabel(tag)}
                  <span aria-hidden className="text-sm leading-none">
                    ×
                  </span>
                </Link>
              )}
              <div className="relative w-full sm:w-72">
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-3 flex items-center"
                  style={{ color: UI.muted }}
                >
                  <SearchIcon />
                </span>
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search fonts"
                  aria-label="Search fonts"
                  className="w-full pl-9"
                  style={{
                    borderColor: UI.border,
                    background: UI.field,
                    color: UI.fg,
                  }}
                />
              </div>
            </div>
            }
          />
        </GridAlign>

        <CategoryTiles value={category} onChange={setCategory} />

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

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
