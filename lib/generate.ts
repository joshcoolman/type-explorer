import { writeFile } from "fs/promises";
import { findFamily } from "./catalog";
import { getSpecimenCopy } from "./specimen-copy";
import { renderSpecimen } from "./specimen-render";
import type { Palette, ProgressEvent } from "./types";

/**
 * Tier-2 generation, code-rendered. Structure is derived from the catalog and the
 * template by `lib/specimen-render.ts`; only the brief-tailored copy comes from a
 * tiny Sonnet call (`lib/specimen-copy.ts`). No Agent SDK, no HTML written by a
 * model — fast, cheap, and deterministic.
 */

export interface GenerateOptions {
  display: string; // display family name
  text: string; // text family name
  brief?: string;
  paletteMood?: string; // retained for compatibility; not used by the renderer
  palette?: Palette; // baked into the file when present
  outFile: string; // absolute path the specimen is written to
  onEvent: (e: ProgressEvent) => void;
}

export interface GenerateResult {
  ok: boolean;
  costUsd?: number;
  error?: string;
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

  try {
    opts.onEvent({ type: "status", text: "Writing copy…" });
    const { copy } = await getSpecimenCopy({ display, text, brief: opts.brief });

    opts.onEvent({ type: "status", text: "Rendering specimen…" });
    const html = renderSpecimen({ display, text, copy, palette: opts.palette });
    await writeFile(opts.outFile, html, "utf8");

    opts.onEvent({ type: "done", ok: true });
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    opts.onEvent({ type: "done", ok: false, error });
    return { ok: false, error };
  }
}
