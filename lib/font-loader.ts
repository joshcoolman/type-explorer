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

// `fontStack` / `fontStackByName` / `fallbackFor` moved to `lib/font-stack.ts` so
// server components (`/compose`) can call them — a `"use client"` module's exports
// become client references and aren't callable during a server render. Re-exported
// here so existing client imports keep working.
export { fontStack, fontStackByName, fallbackFor } from "./font-stack";
