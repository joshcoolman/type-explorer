import { deleteSpecimen, getSpecimen, readSpecimenHtml } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const html = await readSpecimenHtml(id);

  if (!html) {
    const meta = await getSpecimen(id);
    const message =
      meta?.status === "running"
        ? "This specimen is still being generated."
        : meta?.status === "error"
          ? `Generation failed: ${meta.error ?? "unknown error"}`
          : "Specimen not found.";
    return new Response(
      `<!doctype html><meta charset="utf-8"><body style="font:16px system-ui;background:#0f1115;color:#9aa3b2;padding:40px">${message}</body>`,
      {
        status: meta ? 200 : 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  }

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const ok = await deleteSpecimen(id);
  return new Response(null, { status: ok ? 204 : 404 });
}
