import { NextResponse } from "next/server";
import { readIndex } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const list = await readIndex();
  return NextResponse.json(list);
}
