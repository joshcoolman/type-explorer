"use client";

import { useEffect } from "react";
import type { LibraryEntry } from "@/lib/pairing-library";
import { groupedPairingsFor } from "@/lib/pairing-library";
import {
  useFavorites,
  isPairingFavorite,
  togglePairingFavorite,
} from "@/lib/favorites";
import { PAGE_THEME } from "@/lib/card-themes";
import PairingCard from "./PairingCard";
import { Grid, Label } from "./ui";

/**
 * An overlay that shows the pairings for one source font — curated picks first,
 * then the algorithmic contrast suggestions. Reuses PairingCard (and its favorite
 * + font-loading plumbing) so a suggested pairing can be collected just like the
 * hand-mined ones on the home page.
 */
export default function SuggestedPairingsModal({
  source,
  entry,
  onClose,
}: {
  source: string;
  entry: LibraryEntry;
  onClose: () => void;
}) {
  const favorites = useFavorites();
  const { curated, suggested } = groupedPairingsFor(source, entry);

  // Close on Escape; lock background scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // Continuous index across both sections keeps card themes/sample copy varied.
  let i = 0;
  const renderCard = (p: ReturnType<typeof groupedPairingsFor>["curated"][number]) => (
    <PairingCard
      key={p.id}
      heading={p.heading}
      body={p.body}
      label={p.label}
      note={p.why}
      index={i++}
      favorited={isPairingFavorite(favorites, p.id)}
      onToggleFavorite={() => togglePairingFavorite(p)}
    />
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Pairings for ${source}`}
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: "rgba(8, 7, 5, 0.72)" }}
      onClick={onClose}
    >
      <div
        className="mx-auto my-8 w-full max-w-[1100px] rounded-surface p-6 sm:p-8"
        style={{ background: PAGE_THEME.bg, color: PAGE_THEME.fg }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <Label style={{ color: PAGE_THEME.accent }}>Pairs with</Label>
            <h2 className="mt-1 text-2xl sm:text-3xl">{source}</h2>
          </div>
          <button
            type="button"
            aria-label="Close pairings"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors"
            style={{ color: PAGE_THEME.muted }}
          >
            <CloseIcon />
          </button>
        </header>

        {curated.length > 0 && (
          <section className="mb-8">
            <Label className="mb-3 block" style={{ color: PAGE_THEME.muted }}>
              Curated
            </Label>
            <Grid dense>{curated.map(renderCard)}</Grid>
          </section>
        )}

        {suggested.length > 0 && (
          <section>
            <Label className="mb-3 block" style={{ color: PAGE_THEME.muted }}>
              {curated.length > 0 ? "More pairings" : "Suggested pairings"}
            </Label>
            <Grid dense>{suggested.map(renderCard)}</Grid>
          </section>
        )}
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
