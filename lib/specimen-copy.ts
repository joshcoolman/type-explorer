import Anthropic from "@anthropic-ai/sdk";
import type { FontFamily, SpecimenCopy } from "./types";

/**
 * The one small LLM call in tier-2 generation: brief-tailored copy for the
 * In-context spread plus a type-scale word. Plain `@anthropic-ai/sdk` forced tool
 * use (like `lib/propose.ts`), Sonnet, tiny output. Everything structural is done
 * in code by `lib/specimen-render.ts`. Falls back to generic copy on any failure
 * so generation never hard-fails (and gives a zero-cost path).
 */

const DEFAULT_MODEL = "claude-sonnet-4-6";

export interface SpecimenCopyOptions {
  display: FontFamily;
  text: FontFamily;
  brief?: string;
}

export interface SpecimenCopyResult {
  copy: SpecimenCopy;
}

/** Generic copy that names the faces — used as the fallback and for seed rendering. */
export function fallbackCopy(display: string, text: string): SpecimenCopy {
  return {
    contextHeadline: "Setting the tone, word by word",
    contextStandfirst: `${display} carries the headline; ${text} keeps the reading clear and unhurried.`,
    contextBody: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    ],
    scaleWord: "Typography",
  };
}

const COPY_TOOL: Anthropic.Tool = {
  name: "write_specimen_copy",
  description:
    "Return short, brief-appropriate copy to preview a font pairing in context. " +
    "Plain text only — letters, numbers, and standard punctuation; never emoji, " +
    "pictographs, or decorative symbol characters.",
  input_schema: {
    type: "object",
    properties: {
      contextHeadline: {
        type: "string",
        description:
          "A short editorial headline (3-7 words) shown large in the DISPLAY face.",
      },
      contextStandfirst: {
        type: "string",
        description: "One sentence standfirst under the headline, in the text face.",
      },
      contextBody: {
        type: "array",
        minItems: 2,
        maxItems: 3,
        items: { type: "string" },
        description: "2-3 short body paragraphs (2-4 sentences each), in the text face.",
      },
      scaleWord: {
        type: "string",
        description:
          "A single evocative word or very short phrase (1-3 words) shown at every " +
          "size down the type scale.",
      },
    },
    required: ["contextHeadline", "contextStandfirst", "contextBody", "scaleWord"],
  },
};

function buildPrompt(opts: SpecimenCopyOptions): string {
  const { display, text, brief } = opts;
  return [
    "You are a typography-savvy copywriter writing sample copy for a font specimen.",
    "",
    `Display face (headlines): ${display.family} (${display.category}).`,
    `Text face (body/reading): ${text.family} (${text.category}).`,
    brief
      ? `Brief — match this tone and subject: ${brief}`
      : "No specific brief — write tasteful, neutral editorial copy that suits the faces.",
    "",
    "Write copy that reads naturally and shows both faces well. Plain text only:",
    "no emoji, pictographs, or decorative symbols. Do not mention the font names.",
    "Call write_specimen_copy.",
  ].join("\n");
}

function asCopy(input: unknown, display: string, text: string): SpecimenCopy {
  const fb = fallbackCopy(display, text);
  const o = (input ?? {}) as Record<string, unknown>;
  const str = (v: unknown, d: string) =>
    typeof v === "string" && v.trim() ? v.trim() : d;
  const body =
    Array.isArray(o.contextBody) && o.contextBody.length
      ? o.contextBody.filter((p): p is string => typeof p === "string" && !!p.trim())
      : fb.contextBody;
  return {
    contextHeadline: str(o.contextHeadline, fb.contextHeadline),
    contextStandfirst: str(o.contextStandfirst, fb.contextStandfirst),
    contextBody: body.length ? body : fb.contextBody,
    scaleWord: str(o.scaleWord, fb.scaleWord),
  };
}

/** Get brief-tailored copy. Never throws — falls back to generic copy on failure. */
export async function getSpecimenCopy(opts: SpecimenCopyOptions): Promise<SpecimenCopyResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { copy: fallbackCopy(opts.display.family, opts.text.family) };
  }
  const model = process.env.ANTHROPIC_PROPOSAL_MODEL ?? DEFAULT_MODEL;
  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model,
      max_tokens: 800,
      tools: [COPY_TOOL],
      tool_choice: { type: "tool", name: "write_specimen_copy" },
      messages: [{ role: "user", content: buildPrompt(opts) }],
    });
    for (const block of msg.content) {
      if (block.type === "tool_use" && block.name === "write_specimen_copy") {
        return { copy: asCopy(block.input, opts.display.family, opts.text.family) };
      }
    }
  } catch {
    /* fall through to fallback */
  }
  return { copy: fallbackCopy(opts.display.family, opts.text.family) };
}
