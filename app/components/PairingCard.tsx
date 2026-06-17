"use client";

import { useEffect } from "react";
import Link from "next/link";
import { loadFontByName, fontStackByName } from "../../lib/font-loader";
import { sampleForIndex } from "../../lib/specimen-samples";
import { slugify } from "../../lib/slug";
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
  /** Global paragraph override — shown (in the body font) when paragraph
      visibility is on; falls back to the card's own sample paragraph. */
  paragraphOverride?: string;
  /** Optional short rationale shown beside the label (suggested pairings). */
  note?: string;
  /**
   * The font you're currently viewing pairings for (the pairings page). Its name
   * renders as plain text in the footer; the *other* font (the partner) becomes a
   * link to its own pairings page. Omit it (home / favorites) and both names link.
   */
  sourceFamily?: string;
  favorited?: boolean;
  onToggleFavorite?: () => void;
}

export default function PairingCard({
  heading,
  body,
  index,
  titleOverride,
  subtitleOverride,
  paragraphOverride,
  note,
  sourceFamily,
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
  const paragraph = paragraphOverride?.trim() ? paragraphOverride : sample.body;

  // A footer font name: the source (the page you're on) is plain text; the
  // partner links to its own pairings page in a new tab, so you can branch off
  // without losing your place. Subtle — only underlines on hover.
  const fontName = (family: string, prefix?: string) => {
    const isSource = !!sourceFamily && family === sourceFamily;
    return (
      <span className="truncate">
        {prefix}
        {isSource ? (
          family
        ) : (
          <Link
            href={`/pairings/${slugify(family)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open pairings for ${family} in a new tab`}
            className="underline-offset-2 hover:underline"
          >
            {family}
          </Link>
        )}
      </span>
    );
  };

  return (
    <SpecimenCard
      index={index}
      pairing
      titleFont={fontStackByName(heading)}
      bodyFont={fontStackByName(body)}
      title={title}
      subtitle={subtitle}
      paragraph={paragraph}
      favorited={favorited}
      onToggleFavorite={onToggleFavorite}
      favoriteLabel="pairing"
      footer={(theme) => (
        <div
          className="flex min-h-[2.75em] flex-wrap items-baseline justify-between gap-x-3 gap-y-1 font-mono text-[10px] uppercase leading-snug tracking-[0.12em]"
          style={{ color: theme.accent }}
        >
          <span className="flex min-w-0 flex-col">
            {fontName(heading)}
            {fontName(body, "& ")}
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
