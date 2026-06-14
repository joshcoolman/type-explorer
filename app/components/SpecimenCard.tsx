"use client";

import { useEffect } from "react";
import type { SpecimenMeta } from "@/lib/types";
import type { SpecimenControl } from "@/lib/specimen-control";
import { DEFAULT_PALETTE, swatchColors } from "@/lib/palette";
import { fontStackByName, loadFontByName } from "@/lib/font-loader";

/**
 * A grid tile: a lightweight, synthetic preview of the pairing — a display-font
 * headline over a text-font lorem paragraph — rendered as plain app DOM and
 * coloured from the active palette. No iframe, so every card shares one
 * background and the whole grid re-skins instantly when the light/dark toggle or
 * the palette changes. Clicking opens the real full specimen.
 */

const HEADLINE = "The quick brown fox";
const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod " +
  "tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.";

export default function SpecimenCard({
  meta,
  control,
  onOpen,
}: {
  meta: SpecimenMeta;
  control: SpecimenControl;
  onOpen: (id: string) => void;
}) {
  useEffect(() => {
    loadFontByName(meta.display);
    loadFontByName(meta.text);
  }, [meta.display, meta.text]);

  const c = swatchColors(
    control.paletteEnabled ? control.palette : DEFAULT_PALETTE,
    control.mode,
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(meta.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(meta.id);
        }
      }}
      title={`Open ${meta.title}`}
      className="group flex cursor-pointer flex-col overflow-hidden rounded border border-border transition-colors hover:border-muted focus:border-accent focus:outline-none"
    >
      <div
        className="flex h-64 flex-col gap-4 p-5"
        style={{ background: c.background, color: c.foreground }}
      >
        <div
          className="text-3xl leading-tight"
          style={{ fontFamily: fontStackByName(meta.display) }}
        >
          {HEADLINE}
        </div>
        <p
          className="text-sm leading-relaxed"
          style={{ fontFamily: fontStackByName(meta.text), color: c.mutedForeground }}
        >
          {LOREM}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border bg-panel px-3 py-2.5">
        <span className="inline-flex min-w-0 items-center gap-1.5 font-mono text-[11px] text-muted">
          <span className="truncate">{meta.display}</span>
          <span className="opacity-50">/</span>
          <span className="truncate">{meta.text}</span>
        </span>
      </div>
    </div>
  );
}
