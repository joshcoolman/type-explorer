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

/** Progress events streamed from a running specimen generation job. */
export type ProgressEvent =
  | { type: "status"; text: string } // high-level headline
  | { type: "thinking"; text: string } // the agent's reasoning
  | { type: "text"; text: string } // the agent's narration
  | { type: "tool"; tool: string; detail?: string } // a tool call + its key input
  | { type: "done"; ok: boolean; costUsd?: number; error?: string };
