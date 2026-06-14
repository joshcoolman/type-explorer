import Anthropic from "@anthropic-ai/sdk";
import { getCatalog } from "./catalog";
import { parseVariants } from "./css2-url";
import type { Catalog, FontFamily, PairingProposal } from "./types";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const DIGEST_SIZE = 250; // top families by popularity included in the grounding digest

export interface ProposeOptions {
  brief: string;
  lockedFont?: string; // a family that must appear (as display) in every pairing
  exclude?: string[][]; // [display, text] pairs already shown
}

export interface ProposeResult {
  proposals: PairingProposal[];
  error?: string;
}

/** One compact grounding line per family: `Name (category, N weights[, var: tags])`. */
function digestLine(f: FontFamily): string {
  const { uprightWeights, italicWeights } = parseVariants(f.variants);
  const weightCount = new Set([...uprightWeights, ...italicWeights]).size || 1;
  const axes = f.axes?.length ? `, var: ${f.axes.map((a) => a.tag).join(" ")}` : "";
  return `${f.family} (${f.category}, ${weightCount} wght${axes})`;
}

/**
 * Top families by popularity plus the locked font (if any), as compact lines.
 * A few thousand tokens — enough to cover virtually any sensible recommendation
 * while keeping the model anchored to fonts that actually exist.
 */
function buildDigest(catalog: Catalog, lockedFont?: string): string {
  const top = [...catalog.families]
    .sort((a, b) => a.popularityRank - b.popularityRank)
    .slice(0, DIGEST_SIZE);

  if (lockedFont) {
    const locked = catalog.families.find(
      (f) => f.family.toLowerCase() === lockedFont.toLowerCase(),
    );
    if (locked && !top.some((f) => f.family === locked.family)) top.push(locked);
  }

  return top.map(digestLine).join("\n");
}

const PROPOSAL_TOOL: Anthropic.Tool = {
  name: "propose_pairings",
  description:
    "Return 2-4 font pairings (a display face and a text face) that fit the brief. " +
    "Use only fonts from the provided catalog list; never invent a family name.",
  input_schema: {
    type: "object",
    properties: {
      proposals: {
        type: "array",
        minItems: 2,
        maxItems: 4,
        items: {
          type: "object",
          properties: {
            display: {
              type: "string",
              description: "Exact family name of the display face, from the catalog.",
            },
            text: {
              type: "string",
              description: "Exact family name of the text/body face, from the catalog.",
            },
            rationale: {
              type: "string",
              description: "2-3 sentences on why this pairing fits the brief.",
            },
            paletteMood: {
              type: "string",
              description: 'A short palette mood, e.g. "warm editorial", "playful citrus".',
            },
            sampleHeadline: {
              type: "string",
              description:
                "A short brief-appropriate headline to preview the display face. " +
                "Plain text only — letters, numbers, and standard punctuation; " +
                "no emoji, pictographs, or decorative symbols.",
            },
            sampleBody: {
              type: "string",
              description:
                "One or two sentences of brief-appropriate body copy for the text face. " +
                "Plain text only — no emoji, pictographs, or decorative symbols.",
            },
          },
          required: [
            "display",
            "text",
            "rationale",
            "paletteMood",
            "sampleHeadline",
            "sampleBody",
          ],
        },
      },
    },
    required: ["proposals"],
  },
};

function buildPrompt(opts: ProposeOptions, digest: string, retryNote?: string): string {
  const parts = [
    "You are a typography director recommending Google Fonts pairings.",
    "",
    `Brief: ${opts.brief}`,
  ];
  if (opts.lockedFont) {
    parts.push(
      `Constraint: every pairing MUST use "${opts.lockedFont}" as the display face.`,
    );
  }
  if (opts.exclude?.length) {
    const shown = opts.exclude.map(([d, t]) => `${d} + ${t}`).join("; ");
    parts.push(`Do not repeat these already-shown pairings: ${shown}.`);
  }
  parts.push(
    "",
    "Choose ONLY from this catalog (one font per line). Copy family names exactly:",
    digest,
    "",
    "Aim for genuine contrast between the display and text faces, real readability for the body face, and copy that matches the brief's tone.",
    "Sample headline and body copy must be plain text only: letters, numbers, and standard punctuation. Never include emoji, pictographs, or decorative symbol characters, even for icon fonts.",
  );
  if (retryNote) parts.push("", retryNote);
  parts.push("", "Call propose_pairings with 2-4 proposals.");
  return parts.join("\n");
}

function extractProposals(msg: Anthropic.Message): PairingProposal[] {
  for (const block of msg.content) {
    if (block.type === "tool_use" && block.name === "propose_pairings") {
      const input = block.input as { proposals?: PairingProposal[] };
      if (Array.isArray(input.proposals)) return input.proposals;
    }
  }
  return [];
}

/** Keep only proposals whose display and text both resolve to real catalog families. */
function validate(
  proposals: PairingProposal[],
  catalog: Catalog,
): { valid: PairingProposal[]; unknown: string[] } {
  const byName = new Map(catalog.families.map((f) => [f.family.toLowerCase(), f.family]));
  const valid: PairingProposal[] = [];
  const unknown = new Set<string>();

  for (const p of proposals) {
    const d = byName.get(p.display?.trim().toLowerCase() ?? "");
    const t = byName.get(p.text?.trim().toLowerCase() ?? "");
    if (d && t) {
      // Normalize to the catalog's canonical casing.
      valid.push({ ...p, display: d, text: t });
    } else {
      if (!d && p.display) unknown.add(p.display);
      if (!t && p.text) unknown.add(p.text);
    }
  }
  return { valid, unknown: [...unknown] };
}

/**
 * Tier-1 pairing proposals: a single forced-tool-use call grounded by the cached
 * catalog, validated against it, with one retry if too many families hallucinate.
 */
export async function proposePairings(opts: ProposeOptions): Promise<ProposeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { proposals: [], error: "ANTHROPIC_API_KEY is not set." };
  }

  const catalog = await getCatalog();
  const digest = buildDigest(catalog, opts.lockedFont);
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_PROPOSAL_MODEL ?? DEFAULT_MODEL;

  const callOnce = async (retryNote?: string): Promise<PairingProposal[]> => {
    const msg = await client.messages.create({
      model,
      max_tokens: 1500,
      tools: [PROPOSAL_TOOL],
      tool_choice: { type: "tool", name: "propose_pairings" },
      messages: [{ role: "user", content: buildPrompt(opts, digest, retryNote) }],
    });
    return extractProposals(msg);
  };

  try {
    const first = validate(await callOnce(), catalog);
    if (first.valid.length >= 2) return { proposals: first.valid.slice(0, 4) };

    // Retry once, naming the families that did not match the catalog.
    const note = first.unknown.length
      ? `These names were not in the catalog and must not be used: ${first.unknown.join(", ")}. Pick real catalog fonts instead.`
      : "Return at least two pairings using only catalog fonts.";
    const second = validate(await callOnce(note), catalog);

    const combined = dedupe([...first.valid, ...second.valid]);
    if (combined.length >= 1) return { proposals: combined.slice(0, 4) };
    return { proposals: [], error: "Could not produce valid pairings from the catalog." };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Proposal request failed";
    return { proposals: [], error: message };
  }
}

function dedupe(proposals: PairingProposal[]): PairingProposal[] {
  const seen = new Set<string>();
  const out: PairingProposal[] = [];
  for (const p of proposals) {
    const key = `${p.display}|${p.text}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}
