"use client";

import { useEffect } from "react";
import { loadFontByName, fontStackByName } from "../../lib/font-loader";
import { sampleForIndex } from "../../lib/specimen-samples";
import { themeForIndex } from "../../lib/card-themes";
import FavoriteButton from "./FavoriteButton";

interface PairingCardProps {
  heading: string;
  body: string;
  label: string;
  index: number;
  /** Global title override — when non-empty, every card shows this. */
  titleOverride?: string;
  /** Global subtitle override — when non-empty, every card shows this. */
  subtitleOverride?: string;
  favorited?: boolean;
  onToggleFavorite?: () => void;
}

export default function PairingCard({
  heading,
  body,
  label,
  index,
  titleOverride,
  subtitleOverride,
  favorited = false,
  onToggleFavorite,
}: PairingCardProps) {
  useEffect(() => {
    loadFontByName(heading, [400, 600, 700]);
    loadFontByName(body, [400]);
  }, [heading, body]);

  const sample = sampleForIndex(index);
  const title = titleOverride?.trim() ? titleOverride : sample.title;
  const subtitle = subtitleOverride?.trim() ? subtitleOverride : sample.subtitle;
  const theme = themeForIndex(index);

  return (
    <article
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
            label="pairing"
          />
        </div>
      )}

      <h2
        className="pr-10 text-3xl leading-[1.05] sm:text-4xl"
        style={{ fontFamily: fontStackByName(heading), fontWeight: 700 }}
      >
        {title}
      </h2>

      <p
        className="mt-3 text-lg leading-snug sm:text-xl"
        style={{ fontFamily: fontStackByName(body), color: theme.muted }}
      >
        {subtitle}
      </p>

      <div
        className="mt-auto pt-8 font-mono text-[11px] uppercase tracking-[0.16em]"
        style={{ color: theme.accent }}
      >
        {label}
      </div>
    </article>
  );
}
