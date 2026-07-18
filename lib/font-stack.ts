/**
 * CSS `font-family` values and their fallback tails.
 *
 * Deliberately separate from `lib/font-loader.ts`: that module is `"use client"`
 * (it injects <link> tags into the document head), and a client module's exports
 * become client references that a server render cannot call. `/compose` renders
 * on the server and needs these, so they live here as plain, environment-free
 * functions. `font-loader.ts` re-exports them for existing client callers.
 */

import type { FontFamily } from "./types";

/** A quoted CSS font-family value from a bare family name. */
export function fontStackByName(name: string): string {
  return `"${name}", system-ui, sans-serif`;
}

/** The CSS `font-family` value to apply (quoted to handle spaces). */
export function fontStack(family: FontFamily): string {
  return `"${family.family}", ${fallbackFor(family.category)}`;
}

export function fallbackFor(category: FontFamily["category"]): string {
  switch (category) {
    case "serif":
      return "Georgia, 'Times New Roman', serif";
    case "monospace":
      return "ui-monospace, 'SFMono-Regular', Menlo, monospace";
    case "handwriting":
    case "display":
      return "system-ui, sans-serif";
    case "sans-serif":
    default:
      return "system-ui, -apple-system, sans-serif";
  }
}
