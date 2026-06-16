"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { VoiceCopy } from "@/lib/types";
import { Textarea, Panel, Label } from "./ui";

/**
 * A pop-up editor for the explorer's typographic voice — the title, subtitle,
 * and paragraph applied to every card. Rendered as a fixed overlay so it stays
 * reachable from anywhere in the (scrolling) font grid, unlike the old inline
 * panel that scrolled out of view. Mirrors SuggestedPairingsModal's plumbing:
 * Escape to close, backdrop click to close, background scroll lock.
 */
export default function TypographicVoiceModal({
  voice,
  active,
  onChange,
  onReset,
  onClose,
}: {
  voice: VoiceCopy;
  /** Whether any field is set — gates the reset control. */
  active: boolean;
  onChange: (next: VoiceCopy) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Typographic voice"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6"
      style={{ background: "rgba(8, 7, 5, 0.45)" }}
      onClick={onClose}
    >
      <Panel
        radius="card"
        as="section"
        className="theme-light my-8 w-full max-w-2xl border-border bg-panel text-text shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-4">
          <Label as="h2" className="text-accent">
            Typographic voice
          </Label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onReset}
              disabled={!active}
              className="font-mono text-[11px] uppercase tracking-wider text-muted underline-offset-4 hover:underline disabled:opacity-40"
            >
              Reset to default
            </button>
            <button
              type="button"
              aria-label="Close typographic voice"
              onClick={onClose}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-text"
            >
              <CloseIcon />
            </button>
          </div>
        </div>
        <p className="mb-4 max-w-2xl text-sm text-muted">
          Set the text for typographic cards.
        </p>
        <div className="flex flex-col gap-4">
          <Field
            label="Title"
            value={voice.title}
            placeholder="Default sample"
            onChange={(v) => onChange({ ...voice, title: v })}
          />
          <Field
            label="Subtitle"
            value={voice.subtitle}
            placeholder="Default sample"
            onChange={(v) => onChange({ ...voice, subtitle: v })}
          />
          <Field
            label="Paragraph"
            value={voice.paragraph}
            placeholder="Default sample"
            onChange={(v) => onChange({ ...voice, paragraph: v })}
          />
        </div>
      </Panel>
    </div>
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
  const ref = useRef<HTMLTextAreaElement>(null);

  // Grow the field to fit its content so text is never clipped or scrolled.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <label className="flex flex-col gap-2">
      <Label className="text-muted">{label}</Label>
      <Textarea
        ref={ref}
        value={value}
        placeholder={placeholder}
        rows={1}
        onChange={(e) => onChange(e.target.value)}
        className="resize-none overflow-hidden border-border bg-bg text-text placeholder:text-muted focus:border-accent"
      />
    </label>
  );
}

function CloseIcon() {
  return (
    <svg
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
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
