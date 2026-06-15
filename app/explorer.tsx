"use client";

import BrowseView from "./components/BrowseView";

/**
 * The font catalog: a grazing surface of single-font specimen cards over the
 * whole Google Fonts library. Pairing and AI specimen generation were pulled
 * out of the UX (see docs/parked-pairing-and-ai.md) — this page is now purely
 * about looking at fonts and favoriting the ones worth keeping.
 */
export default function Explorer() {
  return (
    <div className="flex h-screen w-full flex-col">
      <header className="flex items-center gap-6 border-b border-border px-6 py-3">
        <h1 className="font-mono text-sm uppercase tracking-[0.2em] text-muted">
          Type Explorer
        </h1>
      </header>
      <div className="min-h-0 flex-1">
        <BrowseView />
      </div>
    </div>
  );
}
