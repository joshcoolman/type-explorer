import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";

export const runtime = "nodejs";

export async function POST() {
  try {
    const catalog = await getCatalog(true);
    return NextResponse.json({
      fetchedAt: catalog.fetchedAt,
      total: catalog.families.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refresh failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
