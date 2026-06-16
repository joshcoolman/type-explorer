"use client";

import { useEffect, useRef, useState } from "react";
import type { FontFamily, VoiceCopy } from "@/lib/types";
import { fontStack, loadPreviewFont } from "@/lib/font-loader";
import SpecimenCard from "./SpecimenCard";

/** Shown on every card until the user overrides a field in the voice panel. */
export const DEFAULT_VOICE: VoiceCopy = {
  title: "Letters That Carry the Weight",
  subtitle:
    "A display voice that performs, set against a text voice that endures.",
  paragraph:
    "A typeface reveals itself at length. In a paragraph you feel its rhythm, the way its counters hold light, how it paces a line. One specimen at reading size tells you more than a dozen names ever could.",
};

interface FontSpecimenCardProps {
  family: FontFamily;
  index: number;
  voice: VoiceCopy;
  favorited?: boolean;
  onToggleFavorite?: () => void;
  /** Whether the pairing library has suggestions for this font. */
  hasPairings?: boolean;
  /** Open the suggested-pairings overlay for this font. */
  onShowPairings?: () => void;
}

export default function FontSpecimenCard({
  family,
  index,
  voice,
  favorited = false,
  onToggleFavorite,
  hasPairings = false,
  onShowPairings,
}: FontSpecimenCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // Lazy-load the family only when the card nears the viewport, so a 60-card
  // page does not fire 60 CDN requests at once.
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [inView]);

  useEffect(() => {
    if (inView) loadPreviewFont(family, [400, 700]);
  }, [inView, family]);

  const title = voice.title.trim() ? voice.title : DEFAULT_VOICE.title;
  const subtitle = voice.subtitle.trim()
    ? voice.subtitle
    : DEFAULT_VOICE.subtitle;
  const paragraph = voice.paragraph.trim()
    ? voice.paragraph
    : DEFAULT_VOICE.paragraph;

  const family_ = inView ? fontStack(family) : "inherit";

  return (
    <SpecimenCard
      cardRef={ref}
      index={index}
      titleFont={family_}
      title={title}
      subtitle={subtitle}
      paragraph={paragraph}
      favorited={favorited}
      onToggleFavorite={onToggleFavorite}
      favoriteLabel="font"
      footer={(theme) => (
        <div className="font-mono text-[11px] uppercase leading-snug tracking-[0.16em]">
          <div className="min-h-[2.75em]" style={{ color: theme.accent }}>
            {family.family}
          </div>
          {/* Reserve the row whether or not this font has pairings, so the rule
              above stays aligned across the grid. */}
          <div className="mt-2 min-h-[2.25em]">
            {hasPairings && onShowPairings && (
              <button
                type="button"
                aria-label={`Get pairings for ${family.family}`}
                onClick={onShowPairings}
                className="inline-flex items-center rounded-[4px] px-3 py-1.5 transition-opacity hover:opacity-70"
                style={{ color: theme.muted, border: `0.5px solid ${theme.muted}` }}
              >
                Get Pairings
              </button>
            )}
          </div>
        </div>
      )}
    />
  );
}
