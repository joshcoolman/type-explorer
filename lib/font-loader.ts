"use client";

import type { FontFamily } from "./types";
import { familyPreviewUrl, familyFullUrl } from "./css2-url";

/**
 * Injects Google Fonts css2 <link> tags into the document head on demand and
 * dedupes families that have already been requested. Browser-only.
 */

const loaded = new Set<string>();

function injectLink(href: string): void {
  if (loaded.has(href)) return;
  loaded.add(href);
  if (typeof document === "undefined") return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

/** Load a single weight (default 400) for a browse-grid preview. */
export function loadPreviewFont(family: FontFamily, weights?: number[]): void {
  injectLink(familyPreviewUrl(family, weights ? { weights } : {}));
}

/** Load the full weight/axis range for a family (proposal previews). */
export function loadFullFont(family: FontFamily): void {
  injectLink(familyFullUrl(family));
}

/**
 * Load a font by family name alone (proposal cards, where only the name is known).
 * Requests a sensible weight spread; the CDN ignores weights a family lacks.
 */
export function loadFontByName(name: string, weights: number[] = [400, 700]): void {
  const plus = name.trim().replace(/\s+/g, "+");
  injectLink(
    `https://fonts.googleapis.com/css2?family=${plus}:wght@${weights.join(";")}&display=swap`,
  );
}

/** A quoted CSS font-family value from a bare family name. */
export function fontStackByName(name: string): string {
  return `"${name}", system-ui, sans-serif`;
}

/** The CSS `font-family` value to apply (quoted to handle spaces). */
export function fontStack(family: FontFamily): string {
  return `"${family.family}", ${fallbackFor(family.category)}`;
}

function fallbackFor(category: FontFamily["category"]): string {
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
