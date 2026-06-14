import { NextRequest, NextResponse } from "next/server";
import { startJob } from "@/lib/jobs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { display, text, brief, paletteMood, palette } = (body ?? {}) as {
    display?: unknown;
    text?: unknown;
    brief?: unknown;
    paletteMood?: unknown;
    palette?: unknown;
  };

  if (typeof display !== "string" || !display.trim()) {
    return NextResponse.json({ error: "display font is required" }, { status: 400 });
  }
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text font is required" }, { status: 400 });
  }

  const hex = (v: unknown) =>
    typeof v === "string" && /^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(v.trim());
  const p = palette as { light?: unknown; dark?: unknown; accent?: unknown } | undefined;
  const validPalette =
    p && hex(p.light) && hex(p.dark) && hex(p.accent)
      ? { light: String(p.light), dark: String(p.dark), accent: String(p.accent) }
      : undefined;

  const meta = startJob({
    display: display.trim(),
    text: text.trim(),
    brief: typeof brief === "string" ? brief.trim() || undefined : undefined,
    paletteMood: typeof paletteMood === "string" ? paletteMood.trim() || undefined : undefined,
    palette: validPalette,
  });

  return NextResponse.json(meta, { status: 201 });
}
