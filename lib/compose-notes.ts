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
  /** A *stated* color renders below its contrast bar. Rendered anyway. */
  | "contrast_below_bar"
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
 * `info` — resolved or adjusted, but still what they meant.
 * `warn` — dropped, substituted, or illegible; the page differs from the ask.
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

/** The whole report in one word, for `data-status` and the JSON's `status`. */
export function statusOf(notes: Note[]): "ok" | "degraded" {
  return notes.length ? "degraded" : "ok";
}

/** Convenience for tests and any consumer that only wants the prose. */
export function messagesOf(notes: Note[]): string[] {
  return notes.map((n) => n.message);
}
