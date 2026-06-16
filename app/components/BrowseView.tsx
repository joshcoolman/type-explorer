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
import FontSpecimenCard, { type VoiceCopy } from "./FontSpecimenCard";
import SuggestedPairingsModal from "./SuggestedPairingsModal";
import { Button, Grid, Input, Textarea, Panel, Label } from "./ui";

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

const VOICE_KEY = "type-explorer:voice";
const EMPTY_VOICE: VoiceCopy = { title: "", subtitle: "", paragraph: "" };

function readVoice(): VoiceCopy {
  if (typeof window === "undefined") return EMPTY_VOICE;
  try {
    const raw = window.localStorage.getItem(VOICE_KEY);
    if (!raw) return EMPTY_VOICE;
    const p = JSON.parse(raw) as Partial<VoiceCopy>;
    return {
      title: p.title ?? "",
      subtitle: p.subtitle ?? "",
      paragraph: p.paragraph ?? "",
    };
  } catch {
    return EMPTY_VOICE;
  }
}

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

  const [showVoice, setShowVoice] = useState(false);
  const [voice, setVoice] = useState<VoiceCopy>(EMPTY_VOICE);

  // Pairing library (lazy-loaded) + which source font's pairings are open.
  const [library, setLibrary] = useState<PairingLibrary | null>(null);
  const [pairingFor, setPairingFor] = useState<string | null>(null);

  const favorites = useFavorites();

  // Hydrate persisted voice after mount (avoids SSR hydration mismatch).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setVoice(readVoice()), []);

  // Pull in the pairing library once; the magic icon appears as it resolves.
  useEffect(() => {
    loadPairingLibrary().then(setLibrary).catch(() => setLibrary({}));
  }, []);

  const updateVoice = useCallback((next: VoiceCopy) => {
    setVoice(next);
    try {
      window.localStorage.setItem(VOICE_KEY, JSON.stringify(next));
    } catch {
      /* storage disabled — keep working in-memory */
    }
  }, []);

  const voiceActive = !!(
    voice.title.trim() ||
    voice.subtitle.trim() ||
    voice.paragraph.trim()
  );

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
          <Button
            type="button"
            size="icon-sm"
            aria-label="Edit typographic voice"
            aria-pressed={showVoice}
            onClick={() => setShowVoice((v) => !v)}
            title="Typographic voice"
            className={`ml-1 border ${
              showVoice
                ? "border-accent text-accent"
                : voiceActive
                  ? "border-muted text-accent"
                  : "border-border text-muted hover:border-muted hover:text-text"
            }`}
          >
            <GearIcon />
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {showVoice && (
          <Panel
            radius="card"
            as="section"
            className="mb-6 border-border bg-panel"
          >
            <div className="mb-3 flex items-center justify-between">
              <Label as="h2" className="text-accent">
                Typographic voice
              </Label>
              <button
                type="button"
                onClick={() => updateVoice(EMPTY_VOICE)}
                disabled={!voiceActive}
                className="font-mono text-[11px] uppercase tracking-wider text-muted underline-offset-4 hover:underline disabled:opacity-40"
              >
                Reset to default
              </button>
            </div>
            <p className="mb-4 max-w-2xl text-sm text-muted">
              Set the title, subtitle, and paragraph shown on every card — useful
              for judging fonts against the same words. Leave a field blank to use
              the default sample copy.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Title"
                value={voice.title}
                placeholder="Default sample"
                onChange={(v) => updateVoice({ ...voice, title: v })}
              />
              <Field
                label="Subtitle"
                value={voice.subtitle}
                placeholder="Default sample"
                onChange={(v) => updateVoice({ ...voice, subtitle: v })}
              />
              <Field
                label="Paragraph"
                value={voice.paragraph}
                placeholder="Default sample"
                onChange={(v) => updateVoice({ ...voice, paragraph: v })}
                multiline
              />
            </div>
          </Panel>
        )}

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
          voice={voice}
          onClose={() => setPairingFor(null)}
        />
      )}
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const color =
    "border-border bg-bg text-text placeholder:text-muted focus:border-accent";
  return (
    <label className="flex flex-col gap-2">
      <Label className="text-muted">{label}</Label>
      {multiline ? (
        <Textarea
          value={value}
          placeholder={placeholder}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          className={color}
        />
      ) : (
        <Input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={color}
        />
      )}
    </label>
  );
}

function GearIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
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
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
