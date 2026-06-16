"use client";

import { useEffect, useState } from "react";
import type { Pairing } from "../../lib/types";
import { PAGE_THEME } from "../../lib/card-themes";
import {
  useFavorites,
  isPairingFavorite,
  togglePairingFavorite,
} from "../../lib/favorites";
import PairingCard from "./PairingCard";
import { Button, Container, Grid, Input, Panel, Label } from "./ui";
import { typeRole } from "./ui";

interface CardCopy {
  title: string;
  subtitle: string;
}

/** Page-chrome surface colors, derived from the fixed dark-neutral PAGE_THEME. */
const UI = {
  bg: PAGE_THEME.bg,
  fg: PAGE_THEME.fg,
  muted: PAGE_THEME.muted,
  accent: PAGE_THEME.accent,
  border: "#2A2823",
  surface: "#1D1B16",
  active: "#262320",
};

const COPY_KEY = "type-explorer:card-copy";

function readCopy(): CardCopy {
  if (typeof window === "undefined") return { title: "", subtitle: "" };
  try {
    const raw = window.localStorage.getItem(COPY_KEY);
    if (!raw) return { title: "", subtitle: "" };
    const p = JSON.parse(raw) as Partial<CardCopy>;
    return { title: p.title ?? "", subtitle: p.subtitle ?? "" };
  } catch {
    return { title: "", subtitle: "" };
  }
}

export default function SuggestedPairings({ pairings }: { pairings: Pairing[] }) {
  const [showSettings, setShowSettings] = useState(false);
  const [copy, setCopy] = useState<CardCopy>({ title: "", subtitle: "" });
  const favorites = useFavorites();

  // Load persisted overrides after mount (avoids SSR hydration mismatch).
  useEffect(() => setCopy(readCopy()), []);

  function updateCopy(next: CardCopy) {
    setCopy(next);
    try {
      window.localStorage.setItem(COPY_KEY, JSON.stringify(next));
    } catch {
      /* storage disabled — keep working in-memory */
    }
  }

  const overridesActive = !!(copy.title.trim() || copy.subtitle.trim());

  return (
    <main className="min-h-screen" style={{ background: UI.bg, color: UI.fg }}>
      <Container className="py-12 sm:py-16">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Label style={{ color: UI.accent }}>Type Explorer</Label>
            <h1 className={`mt-2 ${typeRole.display}`}>Suggested Pairings</h1>
            <p
              className="mt-3 max-w-xl text-sm leading-relaxed"
              style={{ color: UI.muted }}
            >
              A gallery of ready-made display and text pairings. Start from one you
              like instead of a blank search box.
            </p>
          </div>

          <Button
            type="button"
            size="icon"
            shape="pill"
            aria-label="Edit card copy"
            aria-pressed={showSettings}
            onClick={() => setShowSettings((s) => !s)}
            className="border"
            style={{
              borderColor: UI.border,
              color: overridesActive ? UI.accent : UI.fg,
              background: showSettings ? UI.active : "transparent",
            }}
          >
            <GearIcon />
          </Button>
        </header>

        {showSettings && (
          <Panel
            as="section"
            className="mb-10"
            style={{ borderColor: UI.border, background: UI.surface }}
          >
            <div className="mb-4 flex items-center justify-between">
              <Label as="h2" style={{ color: UI.accent }}>
                Card copy
              </Label>
              <button
                type="button"
                onClick={() => updateCopy({ title: "", subtitle: "" })}
                disabled={!overridesActive}
                className="font-mono text-[11px] uppercase tracking-wider underline-offset-4 hover:underline disabled:opacity-40"
                style={{ color: UI.muted }}
              >
                Reset to varied
              </button>
            </div>
            <p className="mb-5 max-w-2xl text-sm" style={{ color: UI.muted }}>
              Set a single title and subtitle to apply to every card — useful when
              comparing pairings against the same words. Leave blank to let each card
              keep its own sample copy.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Title"
                value={copy.title}
                placeholder="Varies per card"
                onChange={(v) => updateCopy({ ...copy, title: v })}
              />
              <Field
                label="Subtitle"
                value={copy.subtitle}
                placeholder="Varies per card"
                onChange={(v) => updateCopy({ ...copy, subtitle: v })}
              />
            </div>
          </Panel>
        )}

        <Grid dense>
          {pairings.map((p, i) => (
            <PairingCard
              key={p.id}
              heading={p.heading}
              body={p.body}
              label={p.label}
              index={i}
              titleOverride={copy.title}
              subtitleOverride={copy.subtitle}
              favorited={isPairingFavorite(favorites, p.id)}
              onToggleFavorite={() => togglePairingFavorite(p)}
            />
          ))}
        </Grid>
      </Container>
    </main>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <Label style={{ color: UI.muted }}>{label}</Label>
      <Input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="focus:ring-2"
        style={{ borderColor: UI.border, background: UI.bg, color: UI.fg }}
      />
    </label>
  );
}

function GearIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
