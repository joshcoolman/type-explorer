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

  const { display, text, brief, paletteMood } = (body ?? {}) as {
    display?: unknown;
    text?: unknown;
    brief?: unknown;
    paletteMood?: unknown;
  };

  if (typeof display !== "string" || !display.trim()) {
    return NextResponse.json({ error: "display font is required" }, { status: 400 });
  }
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text font is required" }, { status: 400 });
  }

  const meta = startJob({
    display: display.trim(),
    text: text.trim(),
    brief: typeof brief === "string" ? brief.trim() || undefined : undefined,
    paletteMood: typeof paletteMood === "string" ? paletteMood.trim() || undefined : undefined,
  });

  return NextResponse.json(meta, { status: 201 });
}
