/**
 * Deterministic sample copy for the Suggested Pairings cards.
 *
 * The pairings JSON (`content/suggested-pairings.json`) stays minimal — just the
 * two font names and a label. The editorial copy that makes each card worth
 * looking at is applied here, by card index, so the same pairing always renders
 * the same words and the JSON stays trivial to grow. (Per-card color lives in
 * `lib/card-themes.ts`.)
 */

import type { VoiceCopy } from "./types";

export interface SampleCopy {
  title: string; // rendered in the heading face
  subtitle: string; // a proper subtitle, rendered in the text face
  body: string; // a running-text paragraph (used by single-font specimens)
}

/** A spread of editorial-flavored sample copy. Plain prose, no emoji. */
const SAMPLES: SampleCopy[] = [
  {
    title: "The Quiet Authority of Good Type",
    subtitle: "How a confident pairing earns trust before the first word is read.",
    body: "Set in a single family, a page can still carry a full range of voice. The same letters that announce a headline can settle into calm, readable prose a moment later — the shape of the type doing the work that color and ornament once did.",
  },
  {
    title: "Letters That Carry the Weight",
    subtitle: "A display voice that performs, set against a text voice that endures.",
    body: "A typeface reveals itself at length. In a paragraph you feel its rhythm, the way its counters hold light, how it paces a line. One specimen at reading size tells you more than a dozen names ever could.",
  },
  {
    title: "Contrast Is a Conversation",
    subtitle: "Letters that differ enough to speak, yet agree on the essentials.",
    body: "Good type does not shout for attention; it earns it quietly. The measure of a face is how little you notice it while reading, and how much you trust the words it carries from the first glance onward.",
  },
  {
    title: "Reading at the Speed of Thought",
    subtitle: "Measure, leading, and weight tuned so the eye never has to slow down.",
    body: "When the spacing is right, the eye glides. Each word arrives in turn without effort, and the reader forgets the machinery entirely. That ease is the whole point — type that disappears into meaning.",
  },
  {
    title: "An Invitation, Not a Wall",
    subtitle: "Start from a single example instead of a thousand blank choices.",
    body: "A library of fonts can feel like a wall of names. Seen one at a time, in real words, each face becomes a decision you can actually make. You stop searching and start choosing.",
  },
  {
    title: "The Page as a Stage",
    subtitle: "Display size takes the spotlight; reading size tells the story.",
    body: "The same family can hold the room and then lower its voice. A heading commands the top of the page; the paragraph beneath it keeps the promise, sentence after sentence, without ever raising its tone.",
  },
  {
    title: "Warmth, Structure, Restraint",
    subtitle: "The small details of a typeface that set a mood before you can name it.",
    body: "Mood lives in the details — the slope of an italic, the swell of a stroke, the warmth of a curve. You sense it before you can name it, and it colors every word you read in the face.",
  },
  {
    title: "Built to Be Read Twice",
    subtitle: "Sharp at a glance, comfortable up close — a face to build on.",
    body: "Some faces dazzle once and tire quickly. The ones worth keeping reward a second look: clean at a glance, comfortable up close, and steady across the long stretch of a real page of text.",
  },
];

export function sampleForIndex(i: number): SampleCopy {
  return SAMPLES[i % SAMPLES.length];
}

/**
 * The copy every card falls back to, field by field, when the voice leaves one
 * blank. It lives here rather than in `FontSpecimenCard.tsx` (which re-exports it)
 * because that file is `"use client"`, and `/compose` renders on the server —
 * a client module's exports aren't callable or readable during a server render.
 *
 * These defaults are why the minimal compose URL is just `?pairs=...`: publishable
 * editorial copy, not lorem ipsum, so an agent is never burdened with supplying
 * text it has no signal about.
 */
export const DEFAULT_VOICE: VoiceCopy = {
  title: "Letters That Carry the Weight",
  subtitle:
    "A display voice that performs, set against a text voice that endures.",
  paragraph:
    "A typeface reveals itself at length. In a paragraph you feel its rhythm, the way its counters hold light, how it paces a line. One specimen at reading size tells you more than a dozen names ever could.",
};
