import Link from "next/link";
import { PAGE_THEME } from "../../lib/card-themes";
import { Container } from "./ui";

const REPO = "https://github.com/joshcoolman/type-explorer";

/**
 * Global site footer — a thin rule over a single mono row: license on the left,
 * a vertical divider, then the source link.
 */
export default function Footer() {
  return (
    <footer
      style={{
        background: PAGE_THEME.bg,
        color: PAGE_THEME.muted,
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Container className="flex items-center gap-3 py-5 font-mono text-[11px] uppercase tracking-[0.16em]">
        <span>MIT 2026</span>
        <span
          aria-hidden="true"
          className="h-3 w-px"
          style={{ background: "rgba(255,255,255,0.18)" }}
        />
        <a
          href={REPO}
          target="_blank"
          rel="noreferrer"
          className="underline-offset-4 transition-colors hover:underline"
          style={{ color: PAGE_THEME.muted }}
        >
          GitHub
        </a>
        <span className="ml-auto flex items-center gap-3">
          <Link
            href="/changelog"
            className="underline-offset-4 transition-colors hover:underline"
            style={{ color: PAGE_THEME.muted }}
          >
            Changelog
          </Link>
          <span
            aria-hidden="true"
            className="h-3 w-px"
            style={{ background: "rgba(255,255,255,0.18)" }}
          />
          <Link
            href="/backlog"
            className="underline-offset-4 transition-colors hover:underline"
            style={{ color: PAGE_THEME.muted }}
          >
            Backlog
          </Link>
        </span>
      </Container>
    </footer>
  );
}
