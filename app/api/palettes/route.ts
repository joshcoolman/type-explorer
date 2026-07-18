import { NextRequest, NextResponse } from "next/server";
import { checkParams } from "@/lib/api-params";
import {
  CARD_THEMES,
  MOODS,
  PAGE_THEME_DEFAULT,
  HIGHLIGHT_DEFAULT,
} from "@/lib/card-themes";
import { contrastRatio, parseHex } from "@/lib/color";

/**
 * The curated palettes, as data.
 *
 * `lib/card-themes.ts` stays the single source of truth — this route reads it, it
 * doesn't restate it. Adding a palette there makes it queryable here and usable as
 * `/compose?theme=<index>` with no further edits.
 *
 * Contrast ratios are computed rather than stored so they can't drift from the
 * hexes, and so an agent reasoning about accessibility gets the real numbers
 * instead of our assurances.
 */

export const runtime = "nodejs";

const KNOWN_PARAMS = ["mood"] as const;

function ratios(theme: { bg: string; fg: string; muted: string; accent: string }) {
  const bg = parseHex(theme.bg);
  const round = (n: number) => Math.round(n * 100) / 100;
  if (!bg) return null;
  const against = (hex: string) => {
    const rgb = parseHex(hex);
    return rgb ? round(contrastRatio(rgb, bg)) : null;
  };
  return { fg: against(theme.fg), muted: against(theme.muted), accent: against(theme.accent) };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const { ignored, strictError } = checkParams(sp, KNOWN_PARAMS);
  if (strictError) return strictError;

  const moodParam = sp.get("mood")?.trim().toLowerCase() ?? "";
  const moodIndices =
    moodParam && moodParam in MOODS
      ? (MOODS[moodParam as keyof typeof MOODS] as readonly number[])
      : null;

  const palettes = CARD_THEMES.map((theme, index) => ({
    index,
    ...theme,
    contrast: ratios(theme),
    /** Which moods draw on this palette. */
    moods: Object.entries(MOODS)
      .filter(([, indices]) => (indices as readonly number[]).includes(index))
      .map(([name]) => name),
  })).filter((p) => (moodIndices ? moodIndices.includes(p.index) : true));

  return NextResponse.json({
    ignored,
    applied: { mood: moodIndices ? moodParam : null },
    /**
     * Use these as `/compose?theme=<index>`. Arbitrary hex is also accepted —
     * `theme=bg:212121,accent:E34712` — and any role you omit is derived and
     * contrast-checked against the roles you gave.
     */
    total: palettes.length,
    palettes,
    moods: MOODS,
    pageChrome: { ...PAGE_THEME_DEFAULT, highlight: HIGHLIGHT_DEFAULT },
  });
}
