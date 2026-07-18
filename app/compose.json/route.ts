import { NextResponse, type NextRequest } from "next/server";

import { themeProvenance } from "@/lib/card-themes";
import { statusOf } from "@/lib/compose-notes";
import { resolveCompose } from "@/lib/compose-resolve";
import { contrastRatio, parseHex } from "@/lib/color";
import { getFontResolver } from "@/lib/font-index";
import type { CardHandoff } from "@/lib/handoff";

/**
 * `/compose.json` — the composed page as data.
 *
 * A mirror, not a scrape: this and `app/compose/page.tsx` are two serializers
 * over the same `resolveCompose` output, so they cannot disagree.
 *
 * Why a `.json` path rather than `Accept` negotiation on `/compose`: an agent
 * builds this URL by a pure string swap on the one the user already has, which
 * works from any fetch tool with no header control. A wrong path 404s loudly; a
 * mis-set `Accept` header silently returns HTML that a consumer doesn't notice
 * until parse time. It also has to be a sibling directory — Next's App Router
 * forbids `route.ts` alongside `page.tsx` in one folder.
 *
 * Same never-fail contract as the page: a bad value degrades and is reported in
 * `notes`, never a 500. There is deliberately no `?strict=1` here; `/compose` has
 * no strict mode, because a rendering surface that refuses to render is worse
 * than one that renders a little less.
 */

export const runtime = "nodejs";

/** Bumped when the shape changes in a way a consumer could notice. */
const SPEC_VERSION = "1.0";

function ratio(hex: string, bg: string): number {
  const a = parseHex(hex);
  const b = parseHex(bg);
  if (!a || !b) return 0;
  return Number(contrastRatio(a, b).toFixed(2));
}

function serializeCard(card: CardHandoff, index: number, stated: string[]) {
  const theme = card.theme;
  const colors = themeProvenance(theme, stated);

  const faces = Object.fromEntries(
    card.fonts.map((f) => [
      f.slug,
      {
        family: f.family,
        category: f.category,
        stack: f.stack,
        // `wght 100..900` is right for a human reading the page; a consumer
        // wants the numbers without parsing a string back out.
        axes: Object.fromEntries(
          f.axes.map((a) => {
            const [tag, range] = a.split(" ");
            const [min, max] = range.split("..").map(Number);
            return [tag, [min, max]];
          }),
        ),
        weights: f.weights,
        italic: f.italic,
      },
    ]),
  );

  return {
    index,
    requestedIndex: card.requestedIndex,
    fonts: {
      display: card.fonts[0]?.slug ?? null,
      // A monovoice card carries one face in both roles, not a missing one.
      text: (card.fonts[1] ?? card.fonts[0])?.slug ?? null,
      monovoice: card.role === "both",
    },
    colors,
    contrast: {
      titleOnBg: ratio(theme.title, theme.bg),
      subtitleOnBg: ratio(theme.subtitle, theme.bg),
      paragraphOnBg: ratio(theme.paragraph, theme.bg),
      mutedOnBg: ratio(theme.muted, theme.bg),
      accentOnBg: ratio(theme.accent, theme.bg),
      labelOnBg: ratio(theme.label, theme.bg),
    },
    faces,
    css2: card.css2,
    tokens: { tailwind: card.tailwind, css: card.cssVars },
  };
}

export async function GET(req: NextRequest) {
  const resolve = await getFontResolver();
  const { spec, voice, statedCopy, usedDefaultPairs, handoff } = resolveCompose(
    req.nextUrl.searchParams,
    resolve,
  );

  const copy = (
    text: string,
    stated: boolean,
  ): { text: string; source: "stated" | "default" } => ({
    text,
    source: stated ? "stated" : "default",
  });

  return NextResponse.json({
    specVersion: SPEC_VERSION,
    canonical: `/compose?${spec.canonical}`,
    status: statusOf(spec.notes),
    notes: spec.notes,
    content: {
      for: copy(spec.framing ?? "", Boolean(spec.framing)),
      title: copy(voice.title, statedCopy.title),
      subtitle: copy(voice.subtitle, statedCopy.subtitle),
      paragraph: copy(voice.paragraph, statedCopy.paragraph),
    },
    type: {
      h1: spec.sizes.h1,
      h2: spec.sizes.h2,
      p: spec.sizes.p,
      measureCh: spec.sizes.measureCh,
      displayWeight: spec.sizes.displayWeight,
    },
    page: spec.pageChrome,
    assets: {
      css2: handoff.css2All,
      link: handoff.linkTag,
      import: handoff.importRule,
    },
    // `usedDefaultPairs` says these cards are the site's opener, not the user's
    // ask — without it a consumer would hand over fonts nobody chose.
    usedDefaultPairs,
    cards: handoff.cards.map((card, i) =>
      serializeCard(card, i, spec.statedRoles[i % Math.max(spec.statedRoles.length, 1)] ?? []),
    ),
  });
}
