/**
 * The single resolved model behind a composed page.
 *
 * `/compose` and `/compose.json` are two serializers over *this* — one to HTML,
 * one to JSON. Neither derives from the other, so they cannot drift, and nobody
 * has to parse markup to get the payload.
 *
 * Most of the work already lives in `parseComposeParams`; this adds the four
 * steps the page used to do inline: param normalization, the default-direction
 * fallback, voice defaulting, and the handoff build.
 */

import suggested from "@/content/suggested-pairings.json";

import { parseComposeParams, type ComposePair, type ComposeSpec, type FontResolver } from "./compose-params";
import { buildHandoff, type Handoff } from "./handoff";
import { slugify } from "./slug";
import { DEFAULT_VOICE } from "./specimen-samples";
import type { Pairing, VoiceCopy } from "./types";

export interface ResolvedCompose {
  spec: ComposeSpec;
  /** Cards actually rendered — `spec.pairs`, or the default direction. */
  pairs: ComposePair[];
  /** Copy with editorial defaults filled in. */
  voice: VoiceCopy;
  /** Which voice fields came from the URL rather than our defaults. */
  statedCopy: Record<keyof VoiceCopy, boolean>;
  /** True when nothing in `pairs=` resolved and we're showing our own opener. */
  usedDefaultPairs: boolean;
  handoff: Handoff;
}

/** Next hands `searchParams` as a record; the parser wants URLSearchParams. */
export function toSearchParams(
  raw: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value.length) params.set(key, value[0]);
  }
  return params;
}

/** Fall back to the site's own curated opener when nothing resolvable was named. */
function defaultPairs(resolve: FontResolver): ComposePair[] {
  const { pairings } = suggested as { pairings: Pairing[] };
  const out: ComposePair[] = [];
  for (const p of pairings.slice(0, 3)) {
    const display = resolve(slugify(p.heading));
    const text = resolve(slugify(p.body));
    if (display && text) {
      out.push({ display, text, monovoice: display.family === text.family, requestedIndex: out.length });
    }
  }
  return out;
}

export function resolveCompose(
  params: URLSearchParams,
  resolve: FontResolver,
): ResolvedCompose {
  const spec = parseComposeParams(params, resolve);

  const usedDefaultPairs = spec.pairs.length === 0;
  const pairs = usedDefaultPairs ? defaultPairs(resolve) : spec.pairs;

  const statedCopy = {
    title: Boolean(spec.voice.title),
    subtitle: Boolean(spec.voice.subtitle),
    paragraph: Boolean(spec.voice.paragraph),
  };
  const voice: VoiceCopy = {
    title: spec.voice.title || DEFAULT_VOICE.title,
    subtitle: spec.voice.subtitle || DEFAULT_VOICE.subtitle,
    paragraph: spec.voice.paragraph || DEFAULT_VOICE.paragraph,
  };

  return {
    spec,
    pairs,
    voice,
    statedCopy,
    usedDefaultPairs,
    handoff: buildHandoff(pairs, spec.themes),
  };
}
