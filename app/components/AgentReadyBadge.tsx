"use client";

import { useEffect, useState } from "react";
import { HIGHLIGHT, PAGE_THEME } from "@/lib/card-themes";
import { typeRole } from "./ui";

/**
 * The "Agent Ready" badge and its explainer.
 *
 * No such badge standard exists, which is the point — the capability is entirely
 * machine-readable (`/llms.txt`, `/agent.md`, an `sr-only` pointer in the markup),
 * so a person browsing the site has no way to discover it. The badge is the only
 * human-visible evidence that any of it is there.
 *
 * "Ready" over "Friendly" deliberately: friendly describes an attitude, ready
 * describes a state someone can go and verify. And "Agent" over "AI" — what's true
 * here is narrow and specific (an agent fetches a contract, queries JSON, writes a
 * URL), where "AI-ready" would claim something broader than this delivers.
 *
 * Modal plumbing follows `TypographicVoiceModal`: Escape to close, backdrop click
 * to close, body scroll locked while open.
 */
export default function AgentReadyBadge() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`badge-agent-ready inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${typeRole.label}`}
        // Hot pink, one shade deeper than the obvious one: white on #FF2D95 is
        // ~2.6:1, well under AA for 11px type. #D81B60 still reads hot and clears
        // 4.9:1 — the same bar every agent-supplied color on this site is held to.
        style={{ background: "#D81B60", color: "#FFFFFF" }}
        title="This site can be used by an AI agent"
      >
        <BoltIcon />
        Agent Ready
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Agent Ready"
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-[10vh] w-full max-w-md rounded-2xl border p-6 sm:p-7"
            style={{
              background: PAGE_THEME.bg,
              borderColor: "#2A2823",
              color: PAGE_THEME.fg,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <p className={typeRole.label} style={{ color: HIGHLIGHT }}>
                Agent Ready
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="-mt-1 text-lg leading-none transition-opacity hover:opacity-70"
                style={{ color: PAGE_THEME.muted }}
              >
                ×
              </button>
            </div>

            <p className="mt-4 text-lg leading-snug">
              Just tell your agent about this site. It will know what to do.
            </p>

            {/*
              No feature list, no setup notes. A capability whose whole appeal is
              that it needs no explaining shouldn't arrive with four bullets of
              explaining — and the one thing a reader actually needs is not a
              description of what an agent can do here, but a sentence they can
              paste. The contract itself stays machine-discoverable (/llms.txt,
              /agent.md); a person doesn't have to find it for any of this to work.
            */}
            <p
              className="mt-5 border-t pt-4 text-sm leading-relaxed"
              style={{ borderColor: "#2A2823", color: PAGE_THEME.muted }}
            >
              Try asking:{" "}
              <span style={{ color: PAGE_THEME.fg }}>
                &ldquo;Use googlefontfinder.com to find type for my
                documentation site — calm, competent, dark theme.&rdquo;
              </span>
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function BoltIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />
    </svg>
  );
}
