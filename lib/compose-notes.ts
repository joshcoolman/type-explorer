/**
 * The degradation report, as data rather than prose.
 *
 * `/compose` has always explained itself in sentences, which is right for the
 * hidden `#agent-notes` block — agents read prose fine. But `/compose.json` is a
 * contract, and a consumer that wants to branch on *what kind* of thing happened
 * ("was a card dropped, or merely resolved?") should not have to regex English.
 *
 * So a note now carries a stable `code` alongside the same sentence it always
 * had. The page renders `message` and is unchanged; the JSON serves the whole
 * object. Adding codes later would have been a breaking change to a published
 * contract, which is why they land with the endpoint rather than after it.
 */

export type NoteCode =
  /** A slug we didn't know resolved to the nearest real family. */
  | "slug_resolved"
  /** A pair named a font with no plausible match; that card isn't rendered. */
  | "card_dropped"
  /** The text slug didn't resolve, so the display face carries both roles. */
  | "font_substituted"
  /** Nothing in `pairs` resolved; the site's default direction stood in. */
  | "pairs_fallback"
  /** A value in a theme/page spec wasn't a hex, so the role was derived. */
  | "hex_invalid"
  /**
   * A *stated* color sits below its contrast bar — and rendered anyway, exactly
   * as written. Advisory: nothing changed, so the page is what was asked for.
   */
  | "contrast_below_bar"
  /**
   * A color fell short of its bar and we moved it. The page differs from the
   * ask, which is why this is a separate code from the one above — a consumer
   * branching on "contrast" needs to know whether its hex survived.
   */
  | "contrast_adjusted"
  /** Free text exceeded its cap and was truncated. */
  | "text_truncated"
  /** A URL was removed from free text. */
  | "url_stripped"
  /** An unrecognized query param. */
  | "param_ignored"
  /** A theme spec had nothing usable; a curated palette stood in. */
  | "theme_fallback"
  /** A number was outside its range and was clamped, or was unparseable. */
  | "value_clamped"
  /** More pairs/palettes than the maximum; the extras were dropped. */
  | "pairs_truncated";

/**
 * The distinction is exactly one question: **did the rendered page end up
 * different from what was asked for?**
 *
 * `warn` — yes. A card was dropped, copy was cut, a color was moved.
 * `info` — no. Worth knowing, but the page is what was requested: an ignored
 *   param, a dial clamped to its legal range, a slug resolved to the family it
 *   plainly meant, a stated color that renders below AA *untouched*.
 *
 * This matters more than it looks. An agent optimizing for a clean `status`
 * will avoid whatever trips it, so classifying a deliberate choice as a warning
 * quietly teaches the agent to stop making that choice — which is how a surface
 * ends up discouraging the very freedom it advertises.
 */
export type NoteSeverity = "info" | "warn";

export interface Note {
  code: NoteCode;
  severity: NoteSeverity;
  /** The role, param, slug, or card the note is about. */
  target: string;
  /** Human-readable, and the only part the rendered page shows. */
  message: string;
}

export function note(
  code: NoteCode,
  severity: NoteSeverity,
  target: string,
  message: string,
): Note {
  return { code, severity, target, message };
}

/**
 * The whole report in one word, for `data-status` and the JSON's `status`.
 *
 * `degraded` means the page differs from the ask — so it keys off severity, not
 * note count. Counting notes made an ignored param, or a brand color deliberately
 * rendered below AA, report the same alarm as a dropped card.
 */
export function statusOf(notes: Note[]): "ok" | "degraded" {
  return notes.some((n) => n.severity === "warn") ? "degraded" : "ok";
}

/** Convenience for tests and any consumer that only wants the prose. */
export function messagesOf(notes: Note[]): string[] {
  return notes.map((n) => n.message);
}
