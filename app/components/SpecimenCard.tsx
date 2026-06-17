"use client";

import type { ReactNode, Ref } from "react";
import type { CardTheme } from "@/lib/card-themes";
import { CARD_THEMES, themeForIndex } from "@/lib/card-themes";
import { useCardTheme } from "./CardThemeProvider";
import { useVoice } from "./VoiceProvider";
import FavoriteButton from "./FavoriteButton";

/**
 * The one card. Every card surface in the app — Explorer specimens, Home pairings,
 * the pairings overlay — is this shell: a per-index color field with a favorite
 * control, a title, a subtitle, an optional reading paragraph, and a footer meta
 * row beneath a hairline rule.
 *
 * It is presentation only. Callers own their data and font-loading concerns
 * (lazy specimen loading, two-font pairings) and pass the resolved font stacks in.
 * Variation is parameters, not forks:
 *  - `bodyFont` differs from `titleFont` -> two-font pairing; omit it -> single-font specimen.
 *  - `paragraph` present -> the longer Explorer specimen; absent -> the compact pairing.
 *  - `footer(theme)` renders the meta row (family name + action, or "a & b" + note).
 */
export interface SpecimenCardProps {
  /** Drives the color theme (and lets callers vary sample copy in step). */
  index: number;
  /** Font stack for the title. */
  titleFont: string;
  /** Font stack for subtitle + paragraph. Defaults to `titleFont`. */
  bodyFont?: string;
  title: string;
  subtitle: string;
  /** Optional third reading block — Explorer specimens use it, pairings don't. */
  paragraph?: string;
  favorited?: boolean;
  onToggleFavorite?: () => void;
  /** Accessible noun for the favorite control ("font", "pairing"). */
  favoriteLabel?: string;
  /** Footer meta row, rendered below the rule with the card's resolved theme. */
  footer?: (theme: CardTheme) => ReactNode;
  /** Forwarded to the card element — e.g. for an IntersectionObserver. */
  cardRef?: Ref<HTMLElement>;
}

export default function SpecimenCard({
  index,
  titleFont,
  bodyFont,
  title,
  subtitle,
  paragraph,
  favorited = false,
  onToggleFavorite,
  favoriteLabel = "item",
  footer,
  cardRef,
}: SpecimenCardProps) {
  // When the user has pinned a single theme app-wide, every card uses it;
  // otherwise cards cycle by index for variety (the default). The Colors-page
  // preview lands here too — its index is the selected theme, so it shows that
  // theme in either mode without special-casing.
  const { selectedTheme, useSelected } = useCardTheme();
  const theme = useSelected ? CARD_THEMES[selectedTheme] : themeForIndex(index);
  const body = bodyFont ?? titleFont;

  // Global per-element visibility (toggled by the eyeballs in the voice editor).
  const { visibility } = useVoice();

  return (
    <article
      ref={cardRef}
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
            label={favoriteLabel}
          />
        </div>
      )}

      {visibility.title && (
        <h2
          className="pr-10 text-3xl leading-[1.05] sm:text-4xl"
          style={{ fontFamily: titleFont, fontWeight: 700 }}
        >
          {title}
        </h2>
      )}

      {visibility.subtitle && (
        <p
          className="mt-3 text-lg leading-snug sm:text-xl first:mt-0"
          style={{ fontFamily: body, fontWeight: 400, color: theme.muted }}
        >
          {subtitle}
        </p>
      )}

      {paragraph && visibility.paragraph && (
        <p
          className="mt-5 text-sm leading-relaxed first:mt-0"
          style={{ fontFamily: body, fontWeight: 400, color: theme.muted }}
        >
          {paragraph}
        </p>
      )}

      {footer && (
        <div className="mt-auto pt-12">
          <div className="pt-4" style={{ borderTop: `0.5px solid ${theme.muted}` }}>
            {footer(theme)}
          </div>
        </div>
      )}
    </article>
  );
}
