"use client";

import { useEffect, useRef, useState } from "react";
import type { FontFamily } from "@/lib/types";
import { fontStack, loadPreviewFont } from "@/lib/font-loader";

interface FontCardProps {
  family: FontFamily;
  selected: boolean;
  selectionIndex: number; // 0-based position among selected, or -1
  sort: "popularity" | "trending" | "date" | "alpha";
  onToggle: (family: FontFamily) => void;
}

const SAMPLE = "Typographic voice";

export default function FontCard({
  family,
  selected,
  selectionIndex,
  sort,
  onToggle,
}: FontCardProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [inView]);

  useEffect(() => {
    if (inView) loadPreviewFont(family);
  }, [inView, family]);

  const axisTags = family.axes?.map((a) => a.tag).join(" ") ?? "";
  const rank =
    sort === "trending"
      ? family.trendingRank != null
        ? `#${family.trendingRank + 1} trending`
        : ""
      : `#${family.popularityRank + 1}`;

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onToggle(family)}
      className={`group relative flex flex-col gap-3 rounded border p-4 text-left transition-colors ${
        selected
          ? "border-accent bg-panel-2"
          : "border-border bg-panel hover:border-muted"
      }`}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-semibold text-bg">
          {selectionIndex + 1}
        </span>
      )}

      <div
        className="min-h-[2.4em] text-3xl leading-tight text-text"
        style={{ fontFamily: inView ? fontStack(family) : "inherit" }}
      >
        {SAMPLE}
      </div>

      <div className="mt-auto">
        <div className="truncate text-sm font-medium text-text">
          {family.family}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-wide text-muted">
          <span>{family.category}</span>
          <span aria-hidden>·</span>
          <span>{family.variants.length} styles</span>
          {axisTags && (
            <>
              <span aria-hidden>·</span>
              <span className="text-accent-2">var {axisTags}</span>
            </>
          )}
          {rank && (
            <>
              <span aria-hidden>·</span>
              <span>{rank}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
