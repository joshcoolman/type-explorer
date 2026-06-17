"use client";

import { useEffect } from "react";
import type { LibraryEntry } from "@/lib/pairing-library";
import { groupedPairingsFor } from "@/lib/pairing-library";
import {
  useFavorites,
  isPairingFavorite,
  togglePairingFavorite,
} from "@/lib/favorites";
import { loadFontByName, fontStackByName } from "@/lib/font-loader";
import { sampleForIndex } from "@/lib/specimen-samples";
import PairingCard from "./PairingCard";
import SpecimenCard from "./SpecimenCard";
import { useVoice } from "./VoiceProvider";

/**
 * The clicked-on font, rendered as a full single-font specimen (title +
 * subtitle + paragraph, like the browse grid). It anchors the top-left of the
 * pairings grid; the partners flow to its right. No favorite control — fonts
 * and pairings use separate favorite stores, and this card is just the anchor.
 */
function SourceCard({ family }: { family: string }) {
  const { voice } = useVoice();

  useEffect(() => {
    loadFontByName(family, [400, 700]);
  }, [family]);

  const sample = sampleForIndex(0);
  const stack = fontStackByName(family);
  const title = voice.title.trim() ? voice.title : sample.title;
  const subtitle = voice.subtitle.trim() ? voice.subtitle : sample.subtitle;
  const paragraph = voice.paragraph.trim() ? voice.paragraph : sample.body;

  return (
    <SpecimenCard
      index={0}
      titleFont={stack}
      title={title}
      subtitle={subtitle}
      paragraph={paragraph}
      footer={(theme) => (
        <div className="font-mono text-[11px] uppercase leading-snug tracking-[0.16em]">
          <div className="min-h-[2.75em]" style={{ color: theme.accent }}>
            {family}
          </div>
          <div className="mt-2 min-h-[2.25em]" style={{ color: theme.muted }}>
            Selected
          </div>
        </div>
      )}
    />
  );
}

/**
 * The pairings for one source font — the selected font's own specimen leads
 * (left column), then its curated picks and the algorithmic contrast
 * suggestions flow to the right in one ungrouped set. Reuses PairingCard (and
 * its favorite + font-loading plumbing) so a suggested pairing can be collected
 * just like the hand-mined ones on the showcase.
 */
export default function PairingsView({
  source,
  entry,
}: {
  source: string;
  entry: LibraryEntry;
}) {
  const favorites = useFavorites();
  const { voice } = useVoice();
  const { curated, suggested } = groupedPairingsFor(source, entry);

  // The "Get Pairings" link opts out of Next's scroll-to-top (so it doesn't
  // clobber the browse scroll position), which means we land here at the grid's
  // old offset — start a fresh pairing view at the top instead.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [source]);

  // Source card holds index 0; pairings continue from 1 so themes/copy vary.
  let i = 1;
  const renderCard = (
    p: ReturnType<typeof groupedPairingsFor>["curated"][number],
  ) => (
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

  // Two regions: the selected font sits alone in its own left column, set apart
  // so the relationship reads clearly; the partners form their own grid to the
  // right (curated picks first, then algorithmic suggestions). The whole block
  // is the same 92.5rem measure as every other card surface, left-anchored so
  // the source column edge tracks the page header above it. On mobile it stacks:
  // source on top, partners below.
  return (
    <div className="flex w-full flex-col gap-6 sm:flex-row sm:items-start sm:gap-8 lg:gap-12">
      {/* Sticky on sm+ so the selected font stays in view while the partner
          grid scrolls past it — the relationship stays anchored. */}
      <div className="sm:sticky sm:top-6 sm:w-[22rem] sm:shrink-0 sm:self-start">
        <SourceCard family={source} />
      </div>
      <div className="grid flex-1 grid-cols-1 justify-start gap-4 sm:[grid-template-columns:repeat(auto-fill,22rem)] lg:gap-6">
        {[...curated, ...suggested].map(renderCard)}
      </div>
    </div>
  );
}
