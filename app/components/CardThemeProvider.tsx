"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { CARD_THEMES, type PageChromeKey } from "@/lib/card-themes";

const KEY = "type-explorer:card-theme";

/** Page-chrome role -> the CSS custom property it drives on the document root. */
const CSS_VAR: Record<PageChromeKey, string> = {
  bg: "--page-bg",
  fg: "--page-fg",
  muted: "--page-muted",
  accent: "--page-accent",
  highlight: "--page-highlight",
};

type PageChrome = Partial<Record<PageChromeKey, string>>;

interface CardThemeSettings {
  /** Which `CARD_THEMES` entry is the chosen theme. Persists regardless of mode. */
  selectedTheme: number;
  /** When true, every card uses `selectedTheme`; when false, cards cycle (default). */
  useSelected: boolean;
  /** Per-role page-chrome overrides. Absent keys fall back to the CSS defaults. */
  pageChrome: PageChrome;
}

const DEFAULTS: CardThemeSettings = {
  selectedTheme: 0,
  useSelected: false,
  pageChrome: {},
};

function clampIndex(i: unknown): number {
  const n = typeof i === "number" && Number.isInteger(i) ? i : 0;
  return Math.max(0, Math.min(CARD_THEMES.length - 1, n));
}

/** Keep only known keys whose values look like colors — guards bad localStorage. */
function cleanChrome(raw: unknown): PageChrome {
  if (!raw || typeof raw !== "object") return {};
  const out: PageChrome = {};
  for (const key of Object.keys(CSS_VAR) as PageChromeKey[]) {
    const v = (raw as Record<string, unknown>)[key];
    if (typeof v === "string" && v.trim()) out[key] = v;
  }
  return out;
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
      pageChrome: cleanChrome(p.pageChrome),
    };
  } catch {
    return DEFAULTS;
  }
}

/** Push the override map onto the document root; clear vars for absent keys. */
function applyChrome(chrome: PageChrome) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const key of Object.keys(CSS_VAR) as PageChromeKey[]) {
    const value = chrome[key];
    if (value) root.style.setProperty(CSS_VAR[key], value);
    else root.style.removeProperty(CSS_VAR[key]);
  }
}

interface CardThemeContextValue extends CardThemeSettings {
  setSelectedTheme: (i: number) => void;
  setUseSelected: (b: boolean) => void;
  setPageChrome: (key: PageChromeKey, value: string) => void;
  resetPageChrome: () => void;
}

const CardThemeContext = createContext<CardThemeContextValue | null>(null);

/**
 * One global card-color preference for the whole app. The Colors page writes it
 * (which card theme is selected, whether to apply it everywhere, and any
 * page-chrome color overrides); cards read the theme through `SpecimenCard`, and
 * page chrome reads the overrides as live CSS variables on the document root.
 * Persisted to localStorage under one key, hydrated after mount so SSR markup
 * matches. Mirrors `VoiceProvider`.
 */
export function CardThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<CardThemeSettings>(DEFAULTS);

  // Hydrate persisted settings after mount (avoids SSR hydration mismatch), then
  // push any page-chrome overrides onto the document root.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    const next = read();
    setSettings(next);
    applyChrome(next.pageChrome);
  }, []);

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

  const setPageChrome = useCallback(
    (key: PageChromeKey, value: string) => {
      setSettings((prev) => {
        const pageChrome = { ...prev.pageChrome, [key]: value };
        const next = { ...prev, pageChrome };
        try {
          window.localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          /* storage disabled */
        }
        applyChrome(pageChrome);
        return next;
      });
    },
    [],
  );

  const resetPageChrome = useCallback(() => {
    setSettings((prev) => {
      const next = { ...prev, pageChrome: {} };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* storage disabled */
      }
      applyChrome({});
      return next;
    });
  }, []);

  return (
    <CardThemeContext.Provider
      value={{
        ...settings,
        setSelectedTheme,
        setUseSelected,
        setPageChrome,
        resetPageChrome,
      }}
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
    return {
      ...DEFAULTS,
      setSelectedTheme: () => {},
      setUseSelected: () => {},
      setPageChrome: () => {},
      resetPageChrome: () => {},
    };
  }
  return ctx;
}
