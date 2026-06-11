import { query } from "@anthropic-ai/claude-agent-sdk";
import { findFamily } from "./catalog";
import { pairingCss2Url } from "./css2-url";
import { parseVariants } from "./css2-url";
import type { FontFamily, ProgressEvent } from "./types";

export interface GenerateOptions {
  display: string; // display family name
  text: string; // text family name
  brief?: string;
  paletteMood?: string;
  outFile: string; // absolute path the specimen must be written to
  appRoot: string; // cwd; the dir whose .claude/skills/ holds the vendored skill
  onEvent: (e: ProgressEvent) => void;
}

export interface GenerateResult {
  ok: boolean;
  costUsd?: number;
  error?: string;
}

/** A precise, prompt-ready description of a family's real capabilities. */
function describeFamily(f: FontFamily, role: "display" | "text"): string {
  const { uprightWeights, italicWeights } = parseVariants(f.variants);
  const weights = [...new Set([...uprightWeights, ...italicWeights])].sort((a, b) => a - b);
  const lines = [
    `- ${role.toUpperCase()}: ${f.family} (${f.category})`,
    `  weights: ${weights.length ? weights.join(", ") : "400"}`,
    `  italics: ${italicWeights.length ? "yes" : "no"}`,
  ];
  if (f.axes?.length) {
    const axes = f.axes
      .map((a) => `${a.tag} ${a.min}..${a.max} (default ${a.defaultValue})`)
      .join("; ");
    lines.push(`  variable axes: ${axes}`);
  } else {
    lines.push(`  variable axes: none (static font — no axis playground)`);
  }
  return lines.join("\n");
}

function buildPrompt(
  opts: GenerateOptions,
  display: FontFamily,
  text: FontFamily,
  css2Url: string,
): string {
  return [
    `Use the type-specimen skill to generate a self-contained HTML type specimen for this pairing.`,
    ``,
    `Roles are already assigned — do not re-derive them:`,
    describeFamily(display, "display"),
    describeFamily(text, "text"),
    ``,
    `Use ONLY the weights, italics, and variable axes listed above. Never invent capabilities:`,
    `the axis playground must contain exactly one slider per real variable axis of the DISPLAY font,`,
    `and must be omitted entirely if the display font is static.`,
    ``,
    `Use this exact css2 URL verbatim for the <link> — do not construct your own:`,
    css2Url,
    ``,
    opts.brief ? `Design brief (steer copy and tone): ${opts.brief}` : `No specific brief — choose tasteful, neutral sample copy.`,
    opts.paletteMood ? `Palette mood: ${opts.paletteMood} — pick or blend the closest palette from the skill's palettes.md.` : `Choose a palette from the skill's palettes.md that flatters these faces.`,
    ``,
    `Write the finished single HTML file to this exact absolute path: ${opts.outFile}`,
    `Do not write it anywhere else. Self-containment check: no external src/href except fonts.googleapis.com / fonts.gstatic.com.`,
  ].join("\n");
}

function truncate(s: string, n = 200): string {
  const oneLine = s.replace(/\s+/g, " ").trim();
  return oneLine.length > n ? oneLine.slice(0, n) + "…" : oneLine;
}

function toolDetail(name: string, input: Record<string, unknown>): string | undefined {
  const s = (k: string) => (typeof input[k] === "string" ? (input[k] as string) : undefined);
  switch (name.toLowerCase()) {
    case "bash":
      return s("command") ? truncate(s("command")!) : undefined;
    case "read":
    case "write":
    case "edit":
      return s("file_path");
    case "skill":
      return s("command") ?? s("name");
    default:
      return undefined;
  }
}

function toolStatus(name: string): string | undefined {
  const lower = name.toLowerCase();
  if (lower === "skill") return "Loading the type-specimen skill…";
  if (["read"].includes(lower)) return "Reading the template and palettes…";
  if (["write", "edit"].includes(lower)) return "Writing the specimen…";
  return undefined;
}

export async function runGeneration(opts: GenerateOptions): Promise<GenerateResult> {
  const display = await findFamily(opts.display);
  const text = await findFamily(opts.text);
  if (!display || !text) {
    const missing = [!display && opts.display, !text && opts.text].filter(Boolean).join(", ");
    const error = `Unknown font(s) not in catalog: ${missing}`;
    opts.onEvent({ type: "done", ok: false, error });
    return { ok: false, error };
  }

  const css2Url = pairingCss2Url(display, text);
  const prompt = buildPrompt(opts, display, text, css2Url);

  let lastStatus = "";
  const emitStatus = (text: string) => {
    if (text && text !== lastStatus) {
      lastStatus = text;
      opts.onEvent({ type: "status", text });
    }
  };

  emitStatus("Starting specimen generation…");
  let sawTextDelta = false;
  let sawThinkingDelta = false;

  try {
    for await (const msg of query({
      prompt,
      options: {
        cwd: opts.appRoot,
        settingSources: ["project"], // discover .claude/skills from the app
        skills: ["type-specimen"],
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        includePartialMessages: true,
        model: process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8",
      },
    })) {
      if (msg.type === "stream_event") {
        const ev = msg.event as {
          type?: string;
          delta?: { type?: string; text?: string; thinking?: string };
        };
        if (ev.type === "content_block_delta" && ev.delta) {
          if (ev.delta.type === "text_delta" && ev.delta.text) {
            sawTextDelta = true;
            opts.onEvent({ type: "text", text: ev.delta.text });
          } else if (ev.delta.type === "thinking_delta" && ev.delta.thinking) {
            sawThinkingDelta = true;
            opts.onEvent({ type: "thinking", text: ev.delta.thinking });
          }
        }
        continue;
      }

      if (msg.type === "assistant") {
        const content = msg.message?.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === "tool_use") {
              const input = (block.input ?? {}) as Record<string, unknown>;
              opts.onEvent({
                type: "tool",
                tool: block.name,
                detail: toolDetail(block.name, input),
              });
              const status = toolStatus(block.name);
              if (status) emitStatus(status);
            } else if (!sawTextDelta && block.type === "text" && block.text.trim()) {
              opts.onEvent({ type: "text", text: block.text.trim() });
            } else if (!sawThinkingDelta && block.type === "thinking" && block.thinking?.trim()) {
              opts.onEvent({ type: "thinking", text: block.thinking.trim() });
            }
          }
        }
      } else if (msg.type === "result") {
        if (msg.subtype === "success") {
          opts.onEvent({ type: "done", ok: true, costUsd: msg.total_cost_usd });
          return { ok: true, costUsd: msg.total_cost_usd };
        }
        const error = `Agent ended: ${msg.subtype}`;
        opts.onEvent({ type: "done", ok: false, error });
        return { ok: false, error };
      }
    }
    const error = "Agent stream ended without a result";
    opts.onEvent({ type: "done", ok: false, error });
    return { ok: false, error };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    opts.onEvent({ type: "done", ok: false, error });
    return { ok: false, error };
  }
}
