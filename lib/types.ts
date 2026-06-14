export type FontCategory =
  | "serif"
  | "sans-serif"
  | "display"
  | "monospace"
  | "handwriting";

export interface FontAxis {
  tag: string; // e.g. "wght", "opsz", "ital", "SOFT", "WONK"
  min: number;
  max: number;
  defaultValue: number;
}

export interface FontFamily {
  family: string; // "Bricolage Grotesque"
  category: FontCategory;
  variants: string[]; // ["200", "300", ..., "800italic", "regular", "italic"]
  axes?: FontAxis[]; // variable-font axes, if any
  subsets: string[];
  popularityRank: number; // index in the popularity-sorted response (0-based)
  trendingRank?: number; // index in the trending-sorted response
  lastModified: string;
}

export interface Catalog {
  fetchedAt: string; // ISO timestamp of the last successful fetch
  families: FontFamily[];
}

/**
 * The user-controlled specimen palette: three source colours. Lives here (not in
 * the client-only `lib/palette.ts`) so server code — the generation prompt — can
 * import the type. Derivation of the other tokens stays in `lib/palette.ts`.
 */
export interface Palette {
  light: string; // paper / light-mode background, hex
  dark: string; // ink / light-mode foreground, hex
  accent: string; // signal, hex
}

/**
 * The brief-tailored copy a specimen needs — everything that genuinely requires
 * words. Produced by `lib/specimen-copy.ts` (a tiny LLM call) and substituted into
 * the template by `lib/specimen-render.ts`. Everything else is derived from the
 * catalog in code.
 */
export interface SpecimenCopy {
  contextHeadline: string; // the in-context display headline
  contextStandfirst: string; // a one-line standfirst under it
  contextBody: string[]; // 2-3 short body paragraphs (text face)
  scaleWord: string; // the word/short phrase shown down the type-scale ramp
}

export type SpecimenStatus = "running" | "done" | "error";

export interface SpecimenMeta {
  id: string; // uuid
  title: string; // "Fraunces × Libre Franklin"
  display: string;
  text: string;
  brief?: string;
  paletteMood?: string;
  createdAt: string; // ISO timestamp
  status: SpecimenStatus;
  costUsd?: number;
  durationMs?: number; // wall-clock time the generation actually ran
  error?: string;
}

/** A pairing proposal returned by the tier-1 proposals call. */
export interface PairingProposal {
  display: string; // exact family name
  text: string;
  rationale: string;
  paletteMood: string; // e.g. "warm editorial", "cool ink", "playful citrus"
  sampleHeadline: string; // brief-appropriate sample copy for the preview card
  sampleBody: string;
}

/**
 * A proposal persisted to localStorage (the Brief "pairing history"). Carries the
 * brief that produced it and, once generated, a link to its specimen.
 */
export interface SavedPairing extends PairingProposal {
  id: string; // `${display}|${text}` lowercased — same dedupe key as the proposals call
  brief: string; // the brief that produced this pairing
  lockedFont?: string; // the locked display constraint, if any
  createdAt: string; // ISO timestamp
  specimenId?: string; // set when a generation job is started from this pairing
}

/** Progress events streamed from a running specimen generation job. */
export type ProgressEvent =
  | { type: "status"; text: string } // high-level headline
  | { type: "thinking"; text: string } // the agent's reasoning
  | { type: "text"; text: string } // the agent's narration
  | { type: "tool"; tool: string; detail?: string } // a tool call + its key input
  | { type: "done"; ok: boolean; costUsd?: number; error?: string };
