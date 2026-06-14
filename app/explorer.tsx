"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FontFamily, Palette, SpecimenMeta } from "@/lib/types";
import {
  DEFAULT_PALETTE,
  readPaletteState,
  writePaletteState,
} from "@/lib/palette";
import type { SpecimenControl } from "@/lib/specimen-control";
import BrowseView from "./components/BrowseView";
import BriefView from "./components/BriefView";
import LibraryView from "./components/LibraryView";
import LibrarySidebar from "./components/LibrarySidebar";
import GridView from "./components/GridView";
import SettingsPanel from "./components/SettingsPanel";

type View = "browse" | "brief" | "library";

const TABS: { key: View; label: string }[] = [
  { key: "browse", label: "Browse" },
  { key: "brief", label: "Brief" },
  { key: "library", label: "Library" },
];

export default function Explorer() {
  const [view, setView] = useState<View>("browse");
  const [selected, setSelected] = useState<FontFamily[]>([]);
  const [lockedFont, setLockedFont] = useState<FontFamily | null>(null);

  const [specimens, setSpecimens] = useState<SpecimenMeta[]>([]);
  const [activeSpecimen, setActiveSpecimen] = useState<string | null>(null);

  // Specimen appearance, controlled by the user and pushed into every iframe.
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [palette, setPalette] = useState<Palette>(DEFAULT_PALETTE);
  const [paletteEnabled, setPaletteEnabled] = useState(true);
  const [gridMode, setGridMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Hydrate the persisted palette once on mount.
  useEffect(() => {
    const s = readPaletteState();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPalette(s.palette);
    setPaletteEnabled(s.enabled);
  }, []);

  const control = useMemo<SpecimenControl>(
    () => ({ mode, palette, paletteEnabled }),
    [mode, palette, paletteEnabled],
  );

  const updatePalette = useCallback((next: Palette, enabled: boolean) => {
    setPalette(next);
    setPaletteEnabled(enabled);
    writePaletteState({ palette: next, enabled });
  }, []);

  const refreshSpecimens = useCallback(async () => {
    try {
      const res = await fetch("/api/specimens");
      if (!res.ok) return;
      const data = (await res.json()) as SpecimenMeta[];
      setSpecimens(Array.isArray(data) ? data : []);
    } catch {
      /* generation not wired yet, or transient — ignore */
    }
  }, []);

  useEffect(() => {
    // Load the persisted specimen list once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshSpecimens();
  }, [refreshSpecimens]);

  // Poor-man's polling: while any specimen is still generating, re-fetch the list
  // on a timer so statuses flip (running → done/error) without a manual refresh,
  // even when the live log panel isn't open. Stops as soon as nothing is running.
  useEffect(() => {
    if (!specimens.some((s) => s.status === "running")) return;
    const t = setInterval(refreshSpecimens, 4000);
    return () => clearInterval(t);
  }, [specimens, refreshSpecimens]);

  const toggleSelect = useCallback((family: FontFamily) => {
    setSelected((prev) => {
      const exists = prev.some((f) => f.family === family.family);
      if (exists) return prev.filter((f) => f.family !== family.family);
      if (prev.length >= 2) return [prev[1], family]; // keep newest two
      return [...prev, family];
    });
  }, []);

  const findPartner = useCallback((family: FontFamily) => {
    setLockedFont(family);
    setView("brief");
  }, []);

  // Kick off a generation job. Returns the created record (or null on failure)
  // and adds it to the specimen list — but does NOT change the view. Callers
  // decide what to do next: Browse jumps to the Library, Brief stays put. The
  // active palette (when enabled) is baked into the generated file.
  const startGeneration = useCallback(
    async (
      display: string,
      text: string,
      brief?: string,
      paletteMood?: string,
    ): Promise<SpecimenMeta | null> => {
      try {
        const res = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            display,
            text,
            brief,
            paletteMood,
            palette: paletteEnabled ? palette : undefined,
          }),
        });
        const meta = (await res.json()) as SpecimenMeta;
        if (!res.ok) throw new Error((meta as { error?: string }).error ?? "Failed to start");
        setSpecimens((prev) => [meta, ...prev]);
        return meta;
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to start generation");
        return null;
      }
    },
    [palette, paletteEnabled],
  );

  const deleteSpecimen = useCallback(
    (id: string) => {
      setSpecimens((prev) => prev.filter((s) => s.id !== id));
      setActiveSpecimen((cur) => (cur === id ? null : cur));
    },
    [],
  );

  return (
    <div className="flex h-screen w-full">
      {!gridMode && (
        <LibrarySidebar
          specimens={specimens}
          activeId={activeSpecimen}
          onSelect={(id) => {
            setActiveSpecimen(id);
            setView("library");
          }}
          onRefresh={refreshSpecimens}
        />
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-6 border-b border-border px-6 py-3">
          <h1 className="font-mono text-sm uppercase tracking-[0.2em] text-muted">
            Type Explorer
          </h1>
          {!gridMode && (
            <nav className="flex gap-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setView(t.key)}
                  className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                    view === t.key
                      ? "bg-panel-2 text-text"
                      : "text-muted hover:text-text"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          )}
          {gridMode && (
            <span className="text-sm font-medium text-text">Card view</span>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setGridMode((g) => !g)}
              title={gridMode ? "Exit card view" : "Card view"}
              aria-label={gridMode ? "Exit card view" : "Card view"}
              aria-pressed={gridMode}
              className={`flex h-8 w-8 items-center justify-center rounded border transition-colors ${
                gridMode
                  ? "border-accent text-accent"
                  : "border-border text-muted hover:border-muted hover:text-text"
              }`}
            >
              <GridIcon />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              title="Palette settings"
              aria-label="Palette settings"
              className="flex h-8 w-8 items-center justify-center rounded border border-border text-muted hover:border-muted hover:text-text"
            >
              <SlidersIcon />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1">
          {gridMode ? (
            <GridView
              specimens={specimens}
              control={control}
              onSetMode={setMode}
              onDeleted={deleteSpecimen}
            />
          ) : (
            <>
              {view === "browse" && (
                <BrowseView
                  selected={selected}
                  onToggleSelect={toggleSelect}
                  onFindPartner={findPartner}
                  onGenerate={async (d, t) => {
                    const meta = await startGeneration(d.family, t.family);
                    if (meta) {
                      setActiveSpecimen(meta.id);
                      setView("library");
                    }
                  }}
                />
              )}
              {view === "brief" && (
                <BriefView
                  lockedFont={lockedFont}
                  onClearLock={() => setLockedFont(null)}
                  specimens={specimens}
                  onGenerate={startGeneration}
                  onJobDone={refreshSpecimens}
                  onDeleted={deleteSpecimen}
                  control={control}
                />
              )}
              {view === "library" && (
                <LibraryView
                  specimens={specimens}
                  activeId={activeSpecimen}
                  onJobDone={refreshSpecimens}
                  onDeleted={deleteSpecimen}
                  control={control}
                />
              )}
            </>
          )}
        </div>
      </main>

      {settingsOpen && (
        <SettingsPanel
          palette={palette}
          enabled={paletteEnabled}
          onChange={updatePalette}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

function GridIcon() {
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
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function SlidersIcon() {
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
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}
