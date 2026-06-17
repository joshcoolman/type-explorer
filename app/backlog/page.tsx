import type { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import BacklogList from "./BacklogList";

export const metadata: Metadata = {
  title: "Backlog — Type Explorer",
  description: "Parked ideas and future directions for Type Explorer.",
};

export interface BacklogSection {
  heading: string;
  status: string | null;
  /** A shipped/closed item — its status tag marks it done rather than pending. */
  closed: boolean;
  body: string;
}

/** Status tags that mark an item as closed (shipped) rather than an open idea. */
const CLOSED_STATUSES = new Set(["closed", "done", "shipped"]);

function parseSections(raw: string): BacklogSection[] {
  return raw
    .split(/\n(?=## )/)
    .filter((s) => s.trimStart().startsWith("## "))
    .map((s) => {
      const nl = s.indexOf("\n");
      const rawHeading = nl === -1 ? s.slice(3) : s.slice(3, nl);
      const body = nl === -1 ? "" : s.slice(nl + 1).trim();
      const tagMatch = rawHeading.match(/^(.*?)\s*`([^`]+)`\s*$/);
      const heading = tagMatch ? tagMatch[1].trim() : rawHeading.trim();
      const status = tagMatch ? tagMatch[2] : null;
      const closed = status ? CLOSED_STATUSES.has(status.toLowerCase()) : false;
      return { heading, status, closed, body };
    });
}

export default function BacklogPage() {
  const raw = readFileSync(join(process.cwd(), "BACKLOG.md"), "utf8");
  const sections = parseSections(raw);
  return <BacklogList sections={sections} />;
}
