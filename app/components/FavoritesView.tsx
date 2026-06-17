"use client";

import { PAGE_THEME } from "../../lib/card-themes";
import {
  useFavorites,
  toggleFontFavorite,
  togglePairingFavorite,
} from "../../lib/favorites";
import PairingCard from "./PairingCard";
import FontSpecimenCard from "./FontSpecimenCard";
import { useVoice } from "./VoiceProvider";
import { Container, Grid, GridAlign, PageHeader } from "./ui";

const UI = {
  bg: PAGE_THEME.bg,
  fg: PAGE_THEME.fg,
  muted: PAGE_THEME.muted,
  accent: PAGE_THEME.accent,
};

export default function FavoritesView() {
  const favorites = useFavorites();
  const { voice } = useVoice();
  const { fonts, pairings } = favorites;
  const empty = fonts.length === 0 && pairings.length === 0;

  return (
    <main className="flex-1" style={{ background: UI.bg, color: UI.fg }}>
      <Container className="pt-6 pb-12 sm:pt-8 sm:pb-16">
        <GridAlign className="mb-10">
          <PageHeader title="Favorites" className="mb-0" />
        </GridAlign>

        {empty && (
          <GridAlign>
            <div
              className="rounded-2xl border border-dashed py-20 text-center"
              style={{ borderColor: "#2A2823", color: UI.muted }}
            >
              <p className="text-sm">
                Nothing here yet. Heart a font in the Explorer or a pairing on the
                home page to start a collection.
              </p>
            </div>
          </GridAlign>
        )}

        {pairings.length > 0 && (
          <section className="mb-14">
            <GridAlign className="mb-5">
              <SectionHeading label="Pairings" count={pairings.length} />
            </GridAlign>
            <Grid>
              {pairings.map((p, i) => (
                <PairingCard
                  key={p.id}
                  heading={p.heading}
                  body={p.body}
                  label={p.label}
                  index={i}
                  titleOverride={voice.title}
                  subtitleOverride={voice.subtitle}
                  paragraphOverride={voice.paragraph}
                  favorited
                  onToggleFavorite={() => togglePairingFavorite(p)}
                />
              ))}
            </Grid>
          </section>
        )}

        {fonts.length > 0 && (
          <section>
            <GridAlign className="mb-5">
              <SectionHeading label="Fonts" count={fonts.length} />
            </GridAlign>
            <Grid>
              {fonts.map((f, i) => (
                <FontSpecimenCard
                  key={f.family}
                  family={f}
                  index={i}
                  voice={voice}
                  favorited
                  onToggleFavorite={() => toggleFontFavorite(f)}
                />
              ))}
            </Grid>
          </section>
        )}
      </Container>
    </main>
  );
}

function SectionHeading({ label, count }: { label: string; count: number }) {
  return (
    <h2
      className="flex items-baseline gap-2 font-mono text-xs uppercase tracking-[0.18em]"
      style={{ color: UI.accent }}
    >
      {label}
      <span style={{ color: UI.muted }}>{count}</span>
    </h2>
  );
}
