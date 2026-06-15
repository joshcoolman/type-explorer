"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/explorer", label: "Explorer" },
  { href: "/favorites", label: "Favorites" },
];

export default function GlobalNav() {
  const pathname = usePathname();
  return (
    <nav
      className="flex items-center gap-6 px-5 py-3 sm:px-8"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
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
    </nav>
  );
}
