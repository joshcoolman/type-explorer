"use client";

import { useCallback, useEffect, useState } from "react";
import type { FontFamily, SpecimenMeta } from "@/lib/types";
import BrowseView from "./components/BrowseView";
import BriefView from "./components/BriefView";
import LibraryView from "./components/LibraryView";
import LibrarySidebar from "./components/LibrarySidebar";

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

  // Kick off a generation job and jump to the library to watch it.
  const startGeneration = useCallback(
    async (display: string, text: string, brief?: string, paletteMood?: string) => {
      try {
        const res = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ display, text, brief, paletteMood }),
        });
        const meta = (await res.json()) as SpecimenMeta;
        if (!res.ok) throw new Error((meta as { error?: string }).error ?? "Failed to start");
        setSpecimens((prev) => [meta, ...prev]);
        setActiveSpecimen(meta.id);
        setView("library");
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to start generation");
      }
    },
    [],
  );

  return (
    <div className="flex h-screen w-full">
      <LibrarySidebar
        specimens={specimens}
        activeId={activeSpecimen}
        onSelect={(id) => {
          setActiveSpecimen(id);
          setView("library");
        }}
        onRefresh={refreshSpecimens}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-6 border-b border-border px-6 py-3">
          <h1 className="font-mono text-sm uppercase tracking-[0.2em] text-muted">
            Type Explorer
          </h1>
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
        </header>

        <div className="min-h-0 flex-1">
          {view === "browse" && (
            <BrowseView
              selected={selected}
              onToggleSelect={toggleSelect}
              onFindPartner={findPartner}
              onGenerate={(d, t) => startGeneration(d.family, t.family)}
            />
          )}
          {view === "brief" && (
            <BriefView
              lockedFont={lockedFont}
              onClearLock={() => setLockedFont(null)}
              onGenerate={startGeneration}
            />
          )}
          {view === "library" && (
            <LibraryView
              specimens={specimens}
              activeId={activeSpecimen}
              onJobDone={refreshSpecimens}
              onDeleted={(id) => {
                setSpecimens((prev) => prev.filter((s) => s.id !== id));
                if (activeSpecimen === id) setActiveSpecimen(null);
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
