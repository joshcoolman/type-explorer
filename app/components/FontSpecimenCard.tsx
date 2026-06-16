"use client";

import { useEffect, useRef, useState } from "react";
import type { FontFamily } from "@/lib/types";
import { fontStack, loadPreviewFont } from "@/lib/font-loader";
import { themeForIndex } from "@/lib/card-themes";
import FavoriteButton from "./FavoriteButton";

export interface VoiceCopy {
  title: string;
  subtitle: string;
  paragraph: string;
}

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
  const theme = themeForIndex(index);

  const family_ = inView ? fontStack(family) : "inherit";

  return (
    <article
      ref={ref}
      className="relative flex flex-col rounded-2xl p-8 sm:p-10"
      style={{ background: theme.bg, color: theme.fg }}
    >
      {onToggleFavorite && (
        <div className="absolute right-4 top-4">
          <FavoriteButton
            active={favorited}
            onToggle={onToggleFavorite}
            color={theme.muted}
            activeColor={theme.accent}
            label="font"
          />
        </div>
      )}

      {hasPairings && onShowPairings && (
        <button
          type="button"
          aria-label={`Show pairings for ${family.family}`}
          onClick={onShowPairings}
          title="Suggest pairings"
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-110"
          style={{ color: theme.muted }}
        >
          <SparkIcon />
        </button>
      )}

      <h2
        className="pr-10 text-3xl leading-[1.05] sm:text-4xl"
        style={{ fontFamily: family_, fontWeight: 700 }}
      >
        {title}
      </h2>

      <p
        className="mt-3 text-lg leading-snug sm:text-xl"
        style={{ fontFamily: family_, fontWeight: 400, color: theme.muted }}
      >
        {subtitle}
      </p>

      <p
        className="mt-5 text-sm leading-relaxed"
        style={{ fontFamily: family_, fontWeight: 400, color: theme.muted }}
      >
        {paragraph}
      </p>

      <div
        className="mt-auto pt-8 font-mono text-[11px] uppercase tracking-[0.16em]"
        style={{ color: theme.accent }}
      >
        {family.family}
      </div>
    </article>
  );
}

/** A small sparkle/wand mark for the "suggest pairings" action. */
function SparkIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2l1.6 4.8a4 4 0 0 0 2.6 2.6L21 11l-4.8 1.6a4 4 0 0 0-2.6 2.6L12 20l-1.6-4.8a4 4 0 0 0-2.6-2.6L3 11l4.8-1.6a4 4 0 0 0 2.6-2.6L12 2z" />
      <path d="M19 14l.7 2.1a2 2 0 0 0 1.2 1.2L23 18l-2.1.7a2 2 0 0 0-1.2 1.2L19 22l-.7-2.1a2 2 0 0 0-1.2-1.2L15 18l2.1-.7a2 2 0 0 0 1.2-1.2L19 14z" />
    </svg>
  );
}
