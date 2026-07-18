import { NextRequest, NextResponse } from "next/server";
import libraryJson from "@/content/pairing-library.json";
import { checkParams } from "@/lib/api-params";
import { groupedPairingsFor, type PairingLibrary } from "@/lib/pairing-library";
import { familyForSlug, slugify } from "@/lib/slug";

/**
 * The pairing library, as data.
 *
 * The `/pairings/[slug]` pages carry rationale prose but no machine-readable
 * specs, which left an agent able to read a recommendation and unable to act on
 * it. This route closes that: every pairing comes back with both font slugs, ready
 * to drop straight into a `/compose?pairs=` URL.
 *
 * Curated pairings are human-picked; suggested ones come from the offline
 * contrast-distance pass and carry a `why`. Both are exposed — an agent choosing
 * between them is making an editorial call we shouldn't make for it.
 */

export const runtime = "nodejs";

const library = libraryJson as PairingLibrary;
const KNOWN_PARAMS = ["font", "limit", "offset"] as const;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const { ignored, strictError } = checkParams(sp, KNOWN_PARAMS);
  if (strictError) return strictError;

  const fontParam = (sp.get("font") ?? "").trim().toLowerCase();
  const limit = Math.min(Number(sp.get("limit") ?? 50) || 50, 200);
  const offset = Math.max(Number(sp.get("offset") ?? 0) || 0, 0);

  const names = Object.keys(library);

  // A single font: return its own curated + suggested partners.
  if (fontParam) {
    const source = familyForSlug(fontParam, names);
    if (!source) {
      return NextResponse.json(
        {
          error: `No pairings for "${fontParam}"`,
          ignored,
          hint: "Slugs are lowercase-hyphenated family names, e.g. playfair-display. Not every family has pairings.",
        },
        { status: 404 },
      );
    }
    const { curated, suggested } = groupedPairingsFor(source, library[source]);
    return NextResponse.json({
      ignored,
      applied: { font: slugify(source) },
      source: { family: source, slug: slugify(source), category: library[source].category },
      curated: curated.map(shape),
      suggested: suggested.map(shape),
    });
  }

  // No font named: an index of every family that has pairings at all.
  const page = names.slice(offset, offset + limit);
  return NextResponse.json({
    ignored,
    applied: { font: null },
    total: names.length,
    offset,
    limit,
    hint: "Add ?font=<slug> for one family's partners.",
    fonts: page.map((family) => ({
      family,
      slug: slugify(family),
      category: library[family].category,
      curatedCount: library[family].curated.length,
      suggestedCount: library[family].suggested.length,
    })),
  });
}

/** Reshape a library pairing into something directly composable. */
function shape(p: { heading: string; body: string; label: string; why?: string }) {
  return {
    label: p.label,
    display: { family: p.heading, slug: slugify(p.heading) },
    text: { family: p.body, slug: slugify(p.body) },
    /** Drop straight into /compose?pairs= */
    composeValue: `${slugify(p.heading)}+${slugify(p.body)}`,
    why: p.why ?? null,
  };
}
