"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HIGHLIGHT, PAGE_THEME } from "../../lib/card-themes";
import { Button } from "./ui";
import { useVoice } from "./VoiceProvider";

const LINKS = [
  { href: "/", label: "Fonts" },
  { href: "/pairings", label: "Pairings" },
  { href: "/favorites", label: "Favorites" },
];

export default function GlobalNav() {
  const pathname = usePathname();
  const { active, open, setOpen } = useVoice();

  return (
    <nav
      className="flex items-center gap-6 px-5 py-3 sm:px-8"
      style={{
        background: PAGE_THEME.bg,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {LINKS.map((l) => {
        const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className="font-mono text-xs uppercase tracking-[0.16em] transition-colors"
            style={{ color: active ? "#F0E4D3" : "#7D7A70" }}
          >
            {l.label}
          </Link>
        );
      })}

      <Button
        type="button"
        size="icon-sm"
        shape="pill"
        aria-label="Edit typographic voice"
        aria-pressed={open}
        title="Typographic voice"
        onClick={() => setOpen(!open)}
        className="ml-auto border"
        style={{
          borderColor: "#2A2823",
          color: active ? HIGHLIGHT : "#7D7A70",
          background: open ? "#262320" : "transparent",
        }}
      >
        <GearIcon />
      </Button>
    </nav>
  );
}

function GearIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
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
