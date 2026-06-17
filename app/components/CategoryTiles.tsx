"use client";

import { useEffect } from "react";
import { PAGE_THEME } from "@/lib/card-themes";
import { fontStackByName, loadFontByName } from "@/lib/font-loader";
import { GridAlign } from "./ui";

const UI = {
  muted: PAGE_THEME.muted,
  border: "#2A2823",
  field: "#1B1A16",
};

/**
 * The category filter, as a visual selector: each tile shows a big "Aa" rendered
 * in a font that reads unmistakably as that style, above the label. "All" uses the
 * neutral UI sans. The `font` picks are the only opinionated bit — swap freely.
 */
const TILES: { key: string; label: string; font: string | null }[] = [
  { key: "all", label: "All", font: null },
  { key: "serif", label: "Serif", font: "Playfair Display" },
  { key: "sans-serif", label: "Sans", font: "Space Grotesk" },
  { key: "display", label: "Display", font: "Anton" },
  { key: "monospace", label: "Mono", font: "Space Mono" },
  { key: "handwriting", label: "Script", font: "Pacifico" },
];

export default function CategoryTiles({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  // Load each representative face once (the CDN ignores weights a family lacks).
  useEffect(() => {
    for (const t of TILES) if (t.font) loadFontByName(t.font, [400, 700]);
  }, []);

  return (
    <GridAlign className="mb-8">
      {/* Spans the card width; 3-up on mobile (two rows), 6 across from sm. */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
        {TILES.map((t) => {
          const on = value === t.key;
          const fontFamily = t.font
            ? fontStackByName(t.font)
            : "var(--font-geist-sans)";
          return (
            <button
              key={t.key}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(t.key)}
              // Aa over the label. Selected just inverts the unselected treatment:
              // dark-on-light vs light-on-dark, reusing the same two colors.
              className="flex min-h-[5.5rem] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-card border px-2 py-3 transition-colors"
              style={{
                background: on ? UI.muted : UI.field,
                color: on ? UI.field : UI.muted,
                borderColor: on ? UI.muted : UI.border,
              }}
            >
              <span
                className="inline-flex items-baseline leading-none"
                style={{ fontFamily }}
              >
                <span className="text-3xl sm:text-4xl">A</span>
                <span className="text-xl sm:text-2xl">a</span>
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em]">
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </GridAlign>
  );
}
