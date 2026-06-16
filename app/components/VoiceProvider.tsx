"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { VoiceCopy } from "@/lib/types";
import TypographicVoiceModal from "./TypographicVoiceModal";

const VOICE_KEY = "type-explorer:voice";
const EMPTY_VOICE: VoiceCopy = { title: "", subtitle: "", paragraph: "" };

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

interface VoiceContextValue {
  /** The current overrides — empty fields mean "use each card's own sample". */
  voice: VoiceCopy;
  /** Whether any field is set. */
  active: boolean;
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
  const [open, setOpen] = useState(false);

  // Hydrate persisted voice after mount (avoids SSR hydration mismatch).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setVoice(readVoice()), []);

  const update = useCallback((next: VoiceCopy) => {
    setVoice(next);
    try {
      window.localStorage.setItem(VOICE_KEY, JSON.stringify(next));
    } catch {
      /* storage disabled — keep working in-memory */
    }
  }, []);

  const reset = useCallback(() => update(EMPTY_VOICE), [update]);

  const active = !!(
    voice.title.trim() ||
    voice.subtitle.trim() ||
    voice.paragraph.trim()
  );

  return (
    <VoiceContext.Provider
      value={{ voice, active, open, setOpen, update, reset }}
    >
      {children}
      {open && (
        <TypographicVoiceModal
          voice={voice}
          active={active}
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
