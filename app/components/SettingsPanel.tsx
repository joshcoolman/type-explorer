"use client";

import type { Palette } from "@/lib/types";
import { DEFAULT_PALETTE, swatchColors } from "@/lib/palette";

/**
 * The palette editor: three source colours (light / dark / accent) plus an
 * on/off switch. Everything else a specimen needs is derived, so the live swatch
 * row shows the derived `muted` (and the rest) before the user commits. Changes
 * are lifted to the host, which persists them and re-skins every specimen.
 */
export default function SettingsPanel({
  palette,
  enabled,
  onChange,
  onClose,
}: {
  palette: Palette;
  enabled: boolean;
  onChange: (palette: Palette, enabled: boolean) => void;
  onClose: () => void;
}) {
  const set = (key: keyof Palette, value: string) =>
    onChange({ ...palette, [key]: value }, enabled);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-6"
      onClick={onClose}
    >
      <div
        className="mt-16 w-full max-w-md rounded-lg border border-border bg-panel shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-medium text-text">Specimen palette</h2>
          <button
            onClick={onClose}
            title="Close"
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded text-muted hover:bg-panel-2 hover:text-text"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm text-text">Use custom palette</span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onChange(palette, e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
          </label>

          <div className={enabled ? "space-y-4" : "space-y-4 opacity-50"}>
            <ColorRow
              label="Light"
              hint="paper · light-mode background"
              value={palette.light}
              disabled={!enabled}
              onChange={(v) => set("light", v)}
            />
            <ColorRow
              label="Dark"
              hint="ink · light-mode text"
              value={palette.dark}
              disabled={!enabled}
              onChange={(v) => set("dark", v)}
            />
            <ColorRow
              label="Accent"
              hint="signal · links & selection"
              value={palette.accent}
              disabled={!enabled}
              onChange={(v) => set("accent", v)}
            />

            <div className="space-y-2 pt-1">
              <SwatchRow mode="light" palette={palette} />
              <SwatchRow mode="dark" palette={palette} />
              <p className="text-[11px] text-muted">
                card, muted, border and the rest are derived automatically.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => onChange(DEFAULT_PALETTE, enabled)}
              className="text-xs text-muted hover:text-text"
            >
              Reset to default
            </button>
            <button
              onClick={onClose}
              className="rounded bg-accent px-4 py-1.5 text-sm font-medium text-bg hover:opacity-90"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorRow({
  label,
  hint,
  value,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  // <input type=color> needs a full #rrggbb; normalise so it never resets to black.
  const normalized = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={normalized}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-9 shrink-0 cursor-pointer rounded border border-border bg-transparent"
        aria-label={label}
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm text-text">{label}</div>
        <div className="font-mono text-[11px] text-muted">{hint}</div>
      </div>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="w-24 rounded border border-border bg-panel-2 px-2 py-1 font-mono text-xs text-text outline-none focus:border-accent"
      />
    </div>
  );
}

function SwatchRow({ mode, palette }: { mode: "light" | "dark"; palette: Palette }) {
  const c = swatchColors(palette, mode);
  return (
    <div className="flex items-center gap-2">
      <span className="w-9 shrink-0 font-mono text-[10px] uppercase tracking-wide text-muted">
        {mode}
      </span>
      <div
        className="flex flex-1 items-center gap-3 rounded border border-border px-3 py-2"
        style={{ background: c.background, color: c.foreground }}
      >
        <span className="text-xs" style={{ color: c.foreground }}>
          Aa
        </span>
        <span className="text-xs" style={{ color: c.mutedForeground }}>
          muted
        </span>
        <span className="ml-auto text-xs font-medium" style={{ color: c.signal }}>
          accent
        </span>
      </div>
    </div>
  );
}
