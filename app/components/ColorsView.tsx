"use client";

import { useEffect, useState } from "react";
import {
  CARD_THEMES,
  HIGHLIGHT,
  PAGE_CHROME_DEFAULTS,
  PAGE_THEME,
  type CardTheme,
  type PageChromeKey,
} from "../../lib/card-themes";
import { fontStackByName, loadFontByName } from "@/lib/font-loader";
import { sampleForIndex } from "@/lib/specimen-samples";
import { useCardTheme } from "./CardThemeProvider";
import SpecimenCard from "./SpecimenCard";
import { useVoice } from "./VoiceProvider";
import { Button, Container, Label, PageHeader } from "./ui";

const UI = {
  bg: PAGE_THEME.bg,
  fg: PAGE_THEME.fg,
  muted: PAGE_THEME.muted,
  accent: PAGE_THEME.accent,
};

/**
 * The font shown in the preview column. Arbitrary — the column exists to carry a
 * theme, not to feature a face — so any legible display family does. Swap freely.
 */
const PREVIEW_FAMILY = "Fraunces";

type View = "preview" | "swatches";

/** bg/fg/muted/accent (+ any extras) as [label, hex] pairs — the shared role list. */
function rolesFor(theme: CardTheme, extra: [string, string][] = []): [string, string][] {
  return [
    ["bg", theme.bg],
    ["fg", theme.fg],
    ["muted", theme.muted],
    ["accent", theme.accent],
    ...extra,
  ];
}

/**
 * Visual reference + live preview for the card colors. A split panel echoing the
 * pairings page: a fixed specimen on the left, the curated `CARD_THEMES` to its
 * right; clicking a theme paints it onto the specimen. The toggle flips only how
 * each theme card renders — full ("preview": title + swatch row) or swatch-only
 * (pure square swatches) — the layout itself never changes.
 */
export default function ColorsView() {
  const [view, setView] = useState<View>("swatches");
  const { selectedTheme, setSelectedTheme, useSelected, setUseSelected } =
    useCardTheme();
  const swatchOnly = view === "swatches";

  return (
    <main className="flex-1" style={{ background: UI.bg, color: UI.fg }}>
      <Container className="pt-6 pb-16 sm:pt-8 sm:pb-24">
        <PageHeader title="Colors" />

        {/* Toggle lives in its own full-width row above the split — not inside a
            column — so it sits just above the cards while the preview card and the
            card grid keep their tops aligned below it. */}
        <div className="mb-5 flex justify-end">
          <ViewToggle view={view} onChange={setView} />
        </div>

        <div className="flex w-full flex-col gap-8 sm:flex-row sm:items-start lg:gap-12">
          {/* Sticky preview — stays in view while the themes scroll past it. */}
          <div className="sm:sticky sm:top-6 sm:w-[24rem] sm:shrink-0 sm:self-start">
            <PreviewCard family={PREVIEW_FAMILY} themeIndex={selectedTheme} />
            <ApplyToggle useSelected={useSelected} onChange={setUseSelected} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {CARD_THEMES.map((theme, i) => (
                <ThemeCard
                  key={i}
                  theme={theme}
                  index={i}
                  swatchOnly={swatchOnly}
                  selected={i === selectedTheme}
                  onSelect={() => setSelectedTheme(i)}
                />
              ))}
            </div>

            <SectionHeading
              label="Page chrome"
              note="The colors of the shell behind the grid and active controls. Edit them below — changes apply across the whole site and persist."
              className="mt-16"
            />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <ThemeCard
                theme={PAGE_THEME}
                label="PAGE_THEME"
                swatchOnly={swatchOnly}
                extraRoles={[["highlight", HIGHLIGHT]]}
              />
            </div>
            <PageChromeEditor />
          </div>
        </div>
      </Container>
    </main>
  );
}

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const options: [View, string][] = [
    ["preview", "Preview"],
    ["swatches", "Swatches"],
  ];
  return (
    <div className="flex gap-1.5">
      {options.map(([key, label]) => {
        const on = view === key;
        return (
          <Button
            key={key}
            size="sm"
            aria-pressed={on}
            onClick={() => onChange(key)}
            style={
              on
                ? { background: HIGHLIGHT, color: UI.bg }
                : { background: "#1F1D19", color: UI.muted }
            }
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}

/**
 * Sits under the preview card. Flips the global card-color preference between
 * "use the selected theme on every card" and "randomize" (the default cycling).
 * Changes nothing on this page — it governs Fonts / Pairings / Favorites — so a
 * caption spells out where the effect shows.
 */
function ApplyToggle({
  useSelected,
  onChange,
}: {
  useSelected: boolean;
  onChange: (b: boolean) => void;
}) {
  const options: [boolean, string][] = [
    [false, "Randomize"],
    [true, "Use selected theme"],
  ];
  return (
    <div className="mt-5">
      <div className="flex gap-1.5">
        {options.map(([value, label]) => {
          const on = useSelected === value;
          return (
            <Button
              key={label}
              size="sm"
              aria-pressed={on}
              onClick={() => onChange(value)}
              style={
                on
                  ? { background: HIGHLIGHT, color: UI.bg }
                  : { background: "#1F1D19", color: UI.muted }
              }
            >
              {label}
            </Button>
          );
        })}
      </div>
      <p className="mt-2.5 text-xs leading-relaxed" style={{ color: UI.muted }}>
        {useSelected
          ? "Every card across Fonts, Pairings, and Favorites uses the selected theme."
          : "Cards across the app cycle through all themes for variety."}
      </p>
    </div>
  );
}

/**
 * Edits the live page-chrome colors. Each swatch is a native color input bound to
 * the override (or the default when none); changing it writes a `--page-*` CSS
 * variable app-wide through `CardThemeProvider`. "Restore defaults" clears every
 * override. Persisted, so edits survive reloads.
 */
const CHROME_ROLES: [PageChromeKey, string][] = [
  ["bg", "Background"],
  ["fg", "Text"],
  ["muted", "Muted"],
  ["accent", "Accent"],
  ["highlight", "Highlight"],
];

function PageChromeEditor() {
  const { pageChrome, setPageChrome, resetPageChrome } = useCardTheme();
  const customized = Object.keys(pageChrome).length > 0;

  return (
    <div className="mt-6 flex flex-wrap items-end gap-x-5 gap-y-4">
      {CHROME_ROLES.map(([key, label]) => {
        const value = (pageChrome[key] ?? PAGE_CHROME_DEFAULTS[key]).toLowerCase();
        return (
          <label key={key} className="flex flex-col gap-1.5">
            <span
              className="font-mono text-[10px] uppercase tracking-[0.16em]"
              style={{ color: UI.muted }}
            >
              {label}
            </span>
            <span className="flex items-center gap-2">
              <input
                type="color"
                value={value}
                aria-label={`${label} color`}
                onChange={(e) => setPageChrome(key, e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-lg border bg-transparent p-1"
                style={{ borderColor: "#2A2823" }}
              />
              <span className="font-mono text-[11px]" style={{ color: UI.muted }}>
                {value.toUpperCase()}
              </span>
            </span>
          </label>
        );
      })}

      <button
        type="button"
        onClick={resetPageChrome}
        disabled={!customized}
        className="font-mono text-[11px] uppercase tracking-[0.16em] underline-offset-4 transition-opacity hover:underline disabled:opacity-40"
        style={{ color: UI.accent }}
      >
        Restore defaults
      </button>
    </div>
  );
}

/**
 * The fixed specimen on the left. Same shape as the pairings source card — a
 * single-font specimen with default voice/sample copy — but its theme tracks the
 * clicked card instead of a fixed index. The face never changes; only the field does.
 */
function PreviewCard({ family, themeIndex }: { family: string; themeIndex: number }) {
  const { voice } = useVoice();

  useEffect(() => {
    loadFontByName(family, [400, 700]);
  }, [family]);

  const sample = sampleForIndex(0);
  const stack = fontStackByName(family);
  const title = voice.title.trim() ? voice.title : sample.title;
  const subtitle = voice.subtitle.trim() ? voice.subtitle : sample.subtitle;
  const paragraph = voice.paragraph.trim() ? voice.paragraph : sample.body;

  return (
    <SpecimenCard
      index={themeIndex}
      titleFont={stack}
      title={title}
      subtitle={subtitle}
      paragraph={paragraph}
      footer={(theme) => (
        <div className="font-mono text-[11px] uppercase leading-snug tracking-[0.16em]">
          <div style={{ color: theme.accent }}>{family}</div>
          <div className="mt-2" style={{ color: theme.muted }}>
            Theme {String(themeIndex + 1).padStart(2, "0")}
          </div>
        </div>
      )}
    />
  );
}

function SectionHeading({
  label,
  note,
  className,
}: {
  label: string;
  note: string;
  className?: string;
}) {
  return (
    <div className={`mb-6 ${className ?? ""}`}>
      <Label style={{ color: UI.accent }} className="block">
        {label}
      </Label>
      <p className="mt-1 text-sm" style={{ color: UI.muted }}>
        {note}
      </p>
    </div>
  );
}

/**
 * One theme in the grid. Two render states, same shell (selectable button with a
 * ring when active):
 *  - default — the full card: a title/subtitle field on the theme's own colors,
 *    then a labeled bg/fg/muted/accent swatch row beneath.
 *  - `swatchOnly` — just the role swatches as pure squares butted at 1px, labeled,
 *    for scanning the palette at a glance.
 */
function ThemeCard({
  theme,
  index,
  label,
  extraRoles = [],
  selected = false,
  onSelect,
  swatchOnly = false,
}: {
  theme: CardTheme;
  index?: number;
  label?: string;
  /** Extra role swatches appended (e.g. HIGHLIGHT on the chrome). */
  extraRoles?: [string, string][];
  selected?: boolean;
  onSelect?: () => void;
  swatchOnly?: boolean;
}) {
  const roles = rolesFor(theme, extraRoles);
  const themeLabel = label ?? `Theme ${String((index ?? 0) + 1).padStart(2, "0")}`;

  const interactive = Boolean(onSelect);
  const Tag = interactive ? "button" : "div";

  return (
    <Tag
      {...(interactive
        ? { type: "button" as const, onClick: onSelect, "aria-pressed": selected }
        : {})}
      className="block w-full overflow-hidden rounded-2xl border text-left transition-shadow"
      style={{
        borderColor: selected ? HIGHLIGHT : "#2A2823",
        boxShadow: selected ? `0 0 0 1px ${HIGHLIGHT}` : undefined,
        cursor: interactive ? "pointer" : undefined,
      }}
    >
      {swatchOnly ? (
        <div className="p-4" style={{ background: PAGE_THEME.bg }}>
          <div
            className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.16em]"
            style={{ color: UI.fg }}
          >
            {themeLabel}
          </div>
          <div className="flex gap-px">
            {roles.map(([role, hex]) => (
              <div key={role} className="min-w-0 flex-1">
                <div className="aspect-square w-full" style={{ background: hex }} />
                <div
                  className="mt-1 text-center font-mono text-[9px] uppercase"
                  style={{ color: UI.muted }}
                >
                  {role}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="p-5" style={{ background: theme.bg }}>
            <p
              className="text-2xl font-semibold leading-tight"
              style={{ color: theme.fg }}
            >
              Title
            </p>
            <p className="mt-1 text-sm" style={{ color: theme.muted }}>
              Subtitle / supporting text
            </p>
            <p
              className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em]"
              style={{ color: theme.accent }}
            >
              {themeLabel}
            </p>
          </div>
          <div
            className="grid"
            style={{
              background: PAGE_THEME.bg,
              gridTemplateColumns: `repeat(${roles.length}, minmax(0, 1fr))`,
            }}
          >
            {roles.map(([role, hex]) => (
              <div
                key={role}
                className="border-t p-2.5"
                style={{ borderColor: "#2A2823" }}
              >
                <div className="mb-1.5 h-6 rounded" style={{ background: hex }} />
                <p
                  className="font-mono text-[10px] uppercase"
                  style={{ color: UI.muted }}
                >
                  {role}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </Tag>
  );
}
