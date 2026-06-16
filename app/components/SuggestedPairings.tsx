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
import { Container, Grid, Label, typeRole } from "./ui";

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
    <main className="min-h-screen" style={{ background: UI.bg, color: UI.fg }}>
      <Container className="py-12 sm:py-16">
        <header className="mb-10">
          <Label style={{ color: UI.accent }}>Type Explorer</Label>
          <h1 className={`mt-2 ${typeRole.display}`}>Suggested Pairings</h1>
          <p
            className="mt-3 max-w-xl text-sm leading-relaxed"
            style={{ color: UI.muted }}
          >
            Distinctive display and text pairings built from lesser-known Google
            Fonts — for a fresher look.
          </p>
        </header>

        <Grid>{pairings.map((p, i) => renderCard(p, i))}</Grid>

        {popular.length > 0 && (
          <section className="mt-16">
            <h2 className={typeRole.display}>Popular Pairings</h2>
            <p
              className="mb-6 mt-3 max-w-xl text-sm leading-relaxed"
              style={{ color: UI.muted }}
            >
              Familiar, widely-used combinations seen across many websites.
            </p>
            <Grid>
              {popular.map((p, i) => renderCard(p, pairings.length + i))}
            </Grid>
          </section>
        )}
      </Container>
    </main>
  );
}
