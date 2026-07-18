import type { ResolvedCardTheme } from "@/lib/card-themes";
import type { ComposePair, ComposeSizes } from "@/lib/compose-params";
import { fontStack } from "@/lib/font-stack";
import type { VoiceCopy } from "@/lib/types";

/**
 * The one `/compose` template: an N-up overview card.
 *
 * Visually this is `SpecimenCard` — same rounded field, same title / subtitle /
 * paragraph / hairline-footer rhythm — but it is deliberately NOT that component.
 * `SpecimenCard` reads `CardThemeProvider` and `VoiceProvider`, which are the
 * *viewer's* localStorage. A composed URL has to render identically for everyone
 * who clicks it, so a visitor's pinned theme or saved voice must not leak into a
 * page an agent composed for someone else. Everything here arrives as props.
 *
 * It is also a server component: sizes are resolved px, and the fonts are loaded
 * by a real <link> in the page's markup rather than by an effect.
 */
export default function ComposeCard({
  pair,
  theme,
  voice,
  sizes,
}: {
  pair: ComposePair;
  theme: ResolvedCardTheme;
  voice: VoiceCopy;
  sizes: ComposeSizes;
}) {
  const displayFont = fontStack(pair.display);
  const textFont = fontStack(pair.text);

  return (
    <article
      className="flex w-full flex-col rounded-2xl"
      style={{
        background: theme.bg,
        color: theme.fg,
        padding: `${sizes.padding}rem`,
      }}
    >
      <h2
        style={{
          fontFamily: displayFont,
          fontWeight: sizes.displayWeight,
          fontSize: `${sizes.h1}px`,
          lineHeight: sizes.h1Leading,
          color: theme.title,
        }}
      >
        {voice.title}
      </h2>

      <p
        className="mt-3"
        style={{
          fontFamily: textFont,
          fontWeight: 400,
          fontSize: `${sizes.h2}px`,
          lineHeight: sizes.h2Leading,
          // The deck needs a measure too now that cards widen with the count —
          // without one it runs the full width of a two-up card and stops
          // scanning as a deck. `ch` is font-relative, so this tracks `h2`.
          maxWidth: `${sizes.measureCh}ch`,
          // Every slot is resolved upstream by `resolveTheme`, so there is no
          // fallback to re-decide here — which is how the subtitle and the
          // paragraph used to end up sharing one color.
          color: theme.subtitle,
        }}
      >
        {voice.subtitle}
      </p>

      <p
        className="mt-5"
        style={{
          fontFamily: textFont,
          fontWeight: 400,
          fontSize: `${sizes.p}px`,
          lineHeight: sizes.pLeading,
          maxWidth: `${sizes.measureCh}ch`,
          color: theme.paragraph,
        }}
      >
        {voice.paragraph}
      </p>

      <div className="mt-auto pt-12">
        <div
          className="pt-4 font-mono text-[11px] uppercase leading-snug tracking-[0.16em]"
          style={{ borderTop: `0.5px solid ${theme.rule}` }}
        >
          <div style={{ color: theme.label }}>
            {pair.monovoice
              ? `${pair.display.family} (both roles)`
              : `${pair.display.family} & ${pair.text.family}`}
          </div>
        </div>
      </div>
    </article>
  );
}
