"use client";

import type { LibraryEntry } from "@/lib/pairing-library";
import { groupedPairingsFor } from "@/lib/pairing-library";
import {
  useFavorites,
  isPairingFavorite,
  togglePairingFavorite,
} from "@/lib/favorites";
import PairingCard from "./PairingCard";
import { useVoice } from "./VoiceProvider";
import { Grid } from "./ui";

/**
 * The pairings for one source font — curated picks first, then the algorithmic
 * contrast suggestions, all in one ungrouped set. Presentational body shared by
 * the `/pairings/[slug]` route; reuses PairingCard (and its favorite +
 * font-loading plumbing) so a suggested pairing can be collected just like the
 * hand-mined ones on the showcase.
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

  // Continuous index across both sections keeps card themes/sample copy varied.
  let i = 0;
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

  // Curated picks lead, algorithmic suggestions follow — one continuous set.
  return <Grid>{[...curated, ...suggested].map(renderCard)}</Grid>;
}
