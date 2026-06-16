"use client";

import type { Pairing } from "../../lib/types";
import { PAGE_THEME } from "../../lib/card-themes";
import {
  useFavorites,
  isPairingFavorite,
  togglePairingFavorite,
} from "../../lib/favorites";
import PairingCard from "./PairingCard";
import { useVoice } from "./VoiceProvider";
import { Container, Grid, GridAlign, PageHeader, typeRole } from "./ui";

/** Page-chrome surface colors, derived from the fixed dark-neutral PAGE_THEME. */
const UI = {
  bg: PAGE_THEME.bg,
  fg: PAGE_THEME.fg,
  muted: PAGE_THEME.muted,
  accent: PAGE_THEME.accent,
};

export default function SuggestedPairings({
  pairings,
  popular = [],
}: {
  pairings: Pairing[];
  popular?: Pairing[];
}) {
  const favorites = useFavorites();
  const { voice } = useVoice();

  const renderCard = (p: Pairing, i: number) => (
    <PairingCard
      key={p.id}
      heading={p.heading}
      body={p.body}
      label={p.label}
      index={i}
      titleOverride={voice.title}
      subtitleOverride={voice.subtitle}
      favorited={isPairingFavorite(favorites, p.id)}
      onToggleFavorite={() => togglePairingFavorite(p)}
    />
  );

  return (
    <main className="flex-1" style={{ background: UI.bg, color: UI.fg }}>
      <Container className="pt-6 pb-12 sm:pt-8 sm:pb-16">
        <GridAlign className="mb-10">
          <PageHeader title="Suggested Pairings" className="mb-0" />
        </GridAlign>

        <Grid>{pairings.map((p, i) => renderCard(p, i))}</Grid>

        {popular.length > 0 && (
          <section className="mt-16">
            <GridAlign className="mb-6">
              <h2 className={typeRole.display}>Popular Pairings</h2>
            </GridAlign>
            <Grid>
              {popular.map((p, i) => renderCard(p, pairings.length + i))}
            </Grid>
          </section>
        )}
      </Container>
    </main>
  );
}
