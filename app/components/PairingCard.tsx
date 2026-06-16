"use client";

import { useEffect } from "react";
import { loadFontByName, fontStackByName } from "../../lib/font-loader";
import { sampleForIndex } from "../../lib/specimen-samples";
import SpecimenCard from "./SpecimenCard";

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

  return (
    <SpecimenCard
      index={index}
      titleFont={fontStackByName(heading)}
      bodyFont={fontStackByName(body)}
      title={title}
      subtitle={subtitle}
      favorited={favorited}
      onToggleFavorite={onToggleFavorite}
      favoriteLabel="pairing"
      footer={(theme) => (
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
      )}
    />
  );
}
