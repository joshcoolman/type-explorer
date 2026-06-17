"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { CARD_THEMES } from "@/lib/card-themes";

const KEY = "type-explorer:card-theme";

interface CardThemeSettings {
  /** Which `CARD_THEMES` entry is the chosen theme. Persists regardless of mode. */
  selectedTheme: number;
  /** When true, every card uses `selectedTheme`; when false, cards cycle (default). */
  useSelected: boolean;
}

const DEFAULTS: CardThemeSettings = { selectedTheme: 0, useSelected: false };

function clampIndex(i: unknown): number {
  const n = typeof i === "number" && Number.isInteger(i) ? i : 0;
  return Math.max(0, Math.min(CARD_THEMES.length - 1, n));
}

function read(): CardThemeSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const p = JSON.parse(raw) as Partial<CardThemeSettings>;
    return {
      selectedTheme: clampIndex(p.selectedTheme),
      useSelected: !!p.useSelected,
    };
  } catch {
    return DEFAULTS;
  }
}

interface CardThemeContextValue extends CardThemeSettings {
  setSelectedTheme: (i: number) => void;
  setUseSelected: (b: boolean) => void;
}

const CardThemeContext = createContext<CardThemeContextValue | null>(null);

/**
 * One global card-color preference for the whole app. The Colors page writes it
 * (which theme is selected, and whether to apply it everywhere); every card reads
 * it through `SpecimenCard`. Persisted to localStorage under one key, hydrated
 * after mount so SSR markup matches. Mirrors `VoiceProvider`.
 */
export function CardThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<CardThemeSettings>(DEFAULTS);

  // Hydrate persisted settings after mount (avoids SSR hydration mismatch).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setSettings(read()), []);

  const update = useCallback((patch: Partial<CardThemeSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* storage disabled — keep working in-memory */
      }
      return next;
    });
  }, []);

  const setSelectedTheme = useCallback(
    (selectedTheme: number) => update({ selectedTheme: clampIndex(selectedTheme) }),
    [update],
  );
  const setUseSelected = useCallback(
    (useSelected: boolean) => update({ useSelected }),
    [update],
  );

  return (
    <CardThemeContext.Provider
      value={{ ...settings, setSelectedTheme, setUseSelected }}
    >
      {children}
    </CardThemeContext.Provider>
  );
}

/**
 * Read the global card-color preference. Tolerant of being called outside the
 * provider (returns inert defaults) so `SpecimenCard` stays usable in isolation
 * (tests, etc.) without throwing.
 */
export function useCardTheme(): CardThemeContextValue {
  const ctx = useContext(CardThemeContext);
  if (!ctx) {
    return { ...DEFAULTS, setSelectedTheme: () => {}, setUseSelected: () => {} };
  }
  return ctx;
}
