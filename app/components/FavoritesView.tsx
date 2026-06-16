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
import { Container, Grid } from "./ui";

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
    <main className="min-h-screen" style={{ background: UI.bg, color: UI.fg }}>
      <Container className="py-12 sm:py-16">
        <header className="mb-10">
          <div
            className="font-mono text-xs uppercase tracking-[0.2em]"
            style={{ color: UI.accent }}
          >
            Type Explorer
          </div>
          <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Favorites</h1>
          <p
            className="mt-3 max-w-xl text-sm leading-relaxed"
            style={{ color: UI.muted }}
          >
            Everything you have collected — single fonts from the catalog and
            pairings from the home page. Tap the heart again to remove.
          </p>
        </header>

        {empty && (
          <div
            className="rounded-2xl border border-dashed py-20 text-center"
            style={{ borderColor: "#2A2823", color: UI.muted }}
          >
            <p className="text-sm">
              Nothing here yet. Heart a font in the Explorer or a pairing on the
              home page to start a collection.
            </p>
          </div>
        )}

        {pairings.length > 0 && (
          <section className="mb-14">
            <SectionHeading label="Pairings" count={pairings.length} />
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
                  favorited
                  onToggleFavorite={() => togglePairingFavorite(p)}
                />
              ))}
            </Grid>
          </section>
        )}

        {fonts.length > 0 && (
          <section>
            <SectionHeading label="Fonts" count={fonts.length} />
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
      className="mb-5 flex items-baseline gap-2 font-mono text-xs uppercase tracking-[0.18em]"
      style={{ color: UI.accent }}
    >
      {label}
      <span style={{ color: UI.muted }}>{count}</span>
    </h2>
  );
}
