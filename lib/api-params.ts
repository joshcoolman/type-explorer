/**
 * Honest handling of unknown query params for the JSON APIs.
 *
 * The prevailing REST convention is to ignore unknown params silently (GitHub's
 * API does exactly this), and that convention is what burned the cold-agent probe
 * that produced the agent-surface plan: `feeling=elegant&category=serif` returned
 * the same count as `category=serif` alone, so the probe concluded the filter was
 * broken. It wasn't — the filter is named `tag`. The probe could not distinguish
 * "feature absent" from "feature under a name I didn't guess."
 *
 * So responses carry an `ignored[]` array: honest *and* non-breaking, unlike both
 * the silent convention and a blanket 400. It only works if callers know to look,
 * which is why `/agent.md` states "check `ignored` in every response" as part of
 * the contract.
 *
 * `?strict=1` opts into the loud version for callers who want a hard failure.
 *
 * Note the deliberate asymmetry with `/compose`, which never fails and instead
 * records degradation in its notes block. A data query that silently lies is
 * poison; a rendering surface that refuses to render is worse than one that
 * renders a little less.
 */

import { NextResponse } from "next/server";

/** `strict` is understood everywhere, so no route has to declare it. */
const UNIVERSAL = new Set(["strict"]);

export interface ParamCheck {
  ignored: string[];
  /** Non-null when `strict=1` was set and unknown params were present. */
  strictError: NextResponse | null;
}

export function checkParams(
  params: URLSearchParams,
  known: readonly string[],
): ParamCheck {
  const allowed = new Set([...known, ...UNIVERSAL]);
  const ignored = [...new Set([...params.keys()])].filter((k) => !allowed.has(k));

  const strict = params.get("strict");
  const isStrict = strict === "1" || strict === "true";

  if (isStrict && ignored.length) {
    return {
      ignored,
      strictError: NextResponse.json(
        {
          error: "Unknown query parameters",
          ignored,
          known: [...known].sort(),
          hint: "Drop ?strict=1 to have these ignored instead of rejected.",
        },
        { status: 400 },
      ),
    };
  }

  return { ignored, strictError: null };
}
