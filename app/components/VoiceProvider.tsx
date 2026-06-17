"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { VoiceCopy, VoiceVisibility } from "@/lib/types";
import TypographicVoiceModal from "./TypographicVoiceModal";

const VOICE_KEY = "type-explorer:voice";
const EMPTY_VOICE: VoiceCopy = { title: "", subtitle: "", paragraph: "" };

const VISIBILITY_KEY = "type-explorer:voice-visibility";
// Paragraph off by default — the compact title+subtitle card is the default look.
const DEFAULT_VISIBILITY: VoiceVisibility = {
  title: true,
  subtitle: true,
  paragraph: false,
};

function readVoice(): VoiceCopy {
  if (typeof window === "undefined") return EMPTY_VOICE;
  try {
    const raw = window.localStorage.getItem(VOICE_KEY);
    if (!raw) return EMPTY_VOICE;
    const p = JSON.parse(raw) as Partial<VoiceCopy>;
    return {
      title: p.title ?? "",
      subtitle: p.subtitle ?? "",
      paragraph: p.paragraph ?? "",
    };
  } catch {
    return EMPTY_VOICE;
  }
}

function readVisibility(): VoiceVisibility {
  if (typeof window === "undefined") return DEFAULT_VISIBILITY;
  try {
    const raw = window.localStorage.getItem(VISIBILITY_KEY);
    if (!raw) return DEFAULT_VISIBILITY;
    const p = JSON.parse(raw) as Partial<VoiceVisibility>;
    const pick = (k: keyof VoiceVisibility) =>
      typeof p[k] === "boolean" ? (p[k] as boolean) : DEFAULT_VISIBILITY[k];
    const next: VoiceVisibility = {
      title: pick("title"),
      subtitle: pick("subtitle"),
      paragraph: pick("paragraph"),
    };
    // Never trust storage into an all-hidden state.
    return next.title || next.subtitle || next.paragraph
      ? next
      : DEFAULT_VISIBILITY;
  } catch {
    return DEFAULT_VISIBILITY;
  }
}

interface VoiceContextValue {
  /** The current overrides — empty fields mean "use each card's own sample". */
  voice: VoiceCopy;
  /** Whether any field is set. */
  active: boolean;
  /** Which voice elements show on cards (global, persisted). */
  visibility: VoiceVisibility;
  /** Toggle one element's visibility; refuses to hide the last visible one. */
  toggleVisibility: (key: keyof VoiceVisibility) => void;
  /** Whether the editor pop-up is open. */
  open: boolean;
  setOpen: (open: boolean) => void;
  update: (next: VoiceCopy) => void;
  reset: () => void;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

/**
 * One global typographic voice for the whole app — Explorer specimens, Home and
 * favorite pairing cards all read it, and the single editor pop-up (opened from
 * the nav gear) writes it. Persisted to localStorage under one key, replacing the
 * per-view voice/copy editors that used to drift apart.
 */
export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [voice, setVoice] = useState<VoiceCopy>(EMPTY_VOICE);
  const [visibility, setVisibility] =
    useState<VoiceVisibility>(DEFAULT_VISIBILITY);
  const [open, setOpen] = useState(false);

  // Hydrate persisted voice + visibility after mount (avoids SSR mismatch).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVoice(readVoice());
    setVisibility(readVisibility());
  }, []);

  const update = useCallback((next: VoiceCopy) => {
    setVoice(next);
    try {
      window.localStorage.setItem(VOICE_KEY, JSON.stringify(next));
    } catch {
      /* storage disabled — keep working in-memory */
    }
  }, []);

  const reset = useCallback(() => update(EMPTY_VOICE), [update]);

  const toggleVisibility = useCallback((key: keyof VoiceVisibility) => {
    setVisibility((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // At least one element must stay visible — a card can't render empty.
      if (!next.title && !next.subtitle && !next.paragraph) return prev;
      try {
        window.localStorage.setItem(VISIBILITY_KEY, JSON.stringify(next));
      } catch {
        /* storage disabled */
      }
      return next;
    });
  }, []);

  const active = !!(
    voice.title.trim() ||
    voice.subtitle.trim() ||
    voice.paragraph.trim()
  );

  return (
    <VoiceContext.Provider
      value={{
        voice,
        active,
        visibility,
        toggleVisibility,
        open,
        setOpen,
        update,
        reset,
      }}
    >
      {children}
      {open && (
        <TypographicVoiceModal
          voice={voice}
          active={active}
          visibility={visibility}
          onToggleVisibility={toggleVisibility}
          onChange={update}
          onReset={reset}
          onClose={() => setOpen(false)}
        />
      )}
    </VoiceContext.Provider>
  );
}

export function useVoice(): VoiceContextValue {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error("useVoice must be used within a VoiceProvider");
  return ctx;
}
