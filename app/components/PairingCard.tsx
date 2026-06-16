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
  /** Optional short rationale shown beside the label (suggested pairings). */
  note?: string;
  favorited?: boolean;
  onToggleFavorite?: () => void;
}

export default function PairingCard({
  heading,
  body,
  index,
  titleOverride,
  subtitleOverride,
  note,
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

      <div className="mt-auto pt-12">
        <div className="pt-4" style={{ borderTop: `0.5px solid ${theme.muted}` }}>
          <div
            className="flex min-h-[2.75em] flex-wrap items-baseline justify-between gap-x-3 gap-y-1 font-mono text-[10px] uppercase leading-snug tracking-[0.12em]"
            style={{ color: theme.accent }}
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{heading}</span>
              <span className="truncate">&amp; {body}</span>
            </span>
            {note && (
              <span className="normal-case tracking-normal" style={{ color: theme.muted }}>
                {note}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
