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
import { useVoice } from "./VoiceProvider";
import { Grid, Label, typeRole } from "./ui";

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
  const { voice } = useVoice();
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
      titleOverride={voice.title}
      subtitleOverride={voice.subtitle}
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
      style={{ background: "rgba(8, 7, 5, 0.25)" }}
      onClick={onClose}
    >
      <div
        className="mx-auto my-4 w-[calc(100%-2rem)] max-w-none rounded-surface p-6 sm:p-8 min-h-[calc(100vh-2rem)] backdrop-blur-xl"
        style={{
          background: "rgba(10, 9, 7, 0.82)",
          color: PAGE_THEME.fg,
          border: "0.5px solid #34302A",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h2 className={typeRole.display}>Suggested Pairings</h2>
            <p
              className="mt-3 max-w-xl text-sm leading-relaxed"
              style={{ color: PAGE_THEME.muted }}
            >
              Suggested pairings for{" "}
              <span style={{ color: PAGE_THEME.fg }}>{source}</span>.
            </p>
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
            <Grid>{curated.map(renderCard)}</Grid>
          </section>
        )}

        {suggested.length > 0 && (
          <section>
            {curated.length > 0 && (
              <Label className="mb-3 block" style={{ color: PAGE_THEME.muted }}>
                More pairings
              </Label>
            )}
            <Grid>{suggested.map(renderCard)}</Grid>
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
