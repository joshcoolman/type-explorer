import { NextRequest, NextResponse } from "next/server";
import { proposePairings } from "@/lib/propose";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { brief, lockedFont, exclude } = (body ?? {}) as {
    brief?: unknown;
    lockedFont?: unknown;
    exclude?: unknown;
  };

  if (typeof brief !== "string" || brief.trim().length < 3) {
    return NextResponse.json(
      { error: "Provide a brief describing what you need." },
      { status: 400 },
    );
  }

  const excludePairs = Array.isArray(exclude)
    ? (exclude.filter(
        (p) => Array.isArray(p) && p.length === 2 && p.every((x) => typeof x === "string"),
      ) as string[][])
    : undefined;

  const result = await proposePairings({
    brief: brief.trim(),
    lockedFont: typeof lockedFont === "string" ? lockedFont : undefined,
    exclude: excludePairs,
  });

  if (result.error && result.proposals.length === 0) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ proposals: result.proposals });
}
