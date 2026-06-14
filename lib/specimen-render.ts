import { readFileSync } from "fs";
import path from "path";
import { parseVariants, pairingCss2Url } from "./css2-url";
import { derivePaletteCss } from "./palette";
import type { FontFamily, Palette, SpecimenCopy } from "./types";

/**
 * Pure, deterministic specimen rendering. Replaces the old Agent-SDK-writes-HTML
 * path: everything structural is computed from the catalog here, and only the
 * brief-tailored copy (a handful of strings) comes from the LLM. The result is a
 * self-contained HTML file identical in structure every time.
 *
 * Reads the canonical scaffold from `.claude/skills/type-specimen/template.html`
 * (which still owns the static CSS + the theme/palette + type-scale JS).
 */

const TEMPLATE_PATH = path.join(
  process.cwd(),
  ".claude/skills/type-specimen/template.html",
);

let cachedTemplate: string | undefined;
function template(): string {
  if (cachedTemplate === undefined) {
    cachedTemplate = readFileSync(TEMPLATE_PATH, "utf8");
  }
  return cachedTemplate;
}

const WEIGHT_STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

/** The discrete weights to expose as type-scale buttons for one face. */
export function weightList(family: FontFamily): number[] {
  const wght = family.axes?.find((a) => a.tag === "wght");
  if (wght) {
    const steps = WEIGHT_STEPS.filter((w) => w >= wght.min && w <= wght.max);
    return steps.length ? steps : [Math.round(wght.min)];
  }
  const { uprightWeights } = parseVariants(family.variants);
  return uprightWeights.length ? uprightWeights : [400];
}

const escapeHtml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Escape a value for inclusion inside a double-quoted JS string literal. */
const escapeJsString = (s: string): string =>
  s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, " ");

export interface RenderInput {
  display: FontFamily;
  text: FontFamily;
  copy: SpecimenCopy;
  palette?: Palette;
}

/** Render the final self-contained specimen HTML. Pure (given the template). */
export function renderSpecimen({ display, text, copy, palette }: RenderInput): string {
  const css2Url = pairingCss2Url(display, text);

  const scaleData = JSON.stringify({
    display: { name: display.family, weights: weightList(display) },
    text: { name: text.family, weights: weightList(text) },
  });

  const paletteBaked = palette
    ? `<style id="palette-baked">${derivePaletteCss(palette)}</style>`
    : "";

  const body = (copy.contextBody?.length ? copy.contextBody : [""])
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("\n        ");

  const subs: Record<string, string> = {
    "{{DISPLAY_NAME}}": display.family,
    "{{TEXT_NAME}}": text.family,
    "{{CSS2_URL}}": css2Url,
    "{{PALETTE_BAKED}}": paletteBaked,
    "{{CONTEXT_HEADLINE}}": escapeHtml(copy.contextHeadline),
    "{{CONTEXT_STANDFIRST}}": escapeHtml(copy.contextStandfirst),
    "{{CONTEXT_BODY}}": body,
    "{{SCALE_DATA}}": scaleData,
    "{{SCALE_WORD}}": escapeJsString(copy.scaleWord),
  };

  let html = template();
  for (const [token, value] of Object.entries(subs)) {
    html = html.split(token).join(value);
  }
  return html;
}
