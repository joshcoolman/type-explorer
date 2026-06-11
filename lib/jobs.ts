import { EventEmitter } from "events";
import { randomUUID } from "crypto";
import { runGeneration } from "./generate";
import {
  readSpecimenHtml,
  specimenHtmlPath,
  upsertSpecimen,
  writeSpecimenHtml,
} from "./store";
import { fmtCost, fmtDuration } from "./format";
import type { ProgressEvent, SpecimenMeta } from "./types";

const MAX_CONCURRENT = 2; // specimen jobs are expensive; a couple at once is plenty
const FOOTER_MARKER = "<!-- type-explorer-footer -->";
const REPO_URL = "https://github.com/joshcoolman/type-explorer";

export interface StartJobInput {
  display: string;
  text: string;
  brief?: string;
  paletteMood?: string;
}

interface Job {
  id: string;
  meta: SpecimenMeta;
  events: ProgressEvent[]; // buffered for late subscribers
  emitter: EventEmitter;
  done: boolean;
}

interface Registry {
  jobs: Map<string, Job>;
  queue: string[];
  active: number;
}

// Persist across Next.js HMR reloads in dev (single Node process).
const g = globalThis as unknown as { __typeExplorerJobs?: Registry };
const registry: Registry =
  g.__typeExplorerJobs ??
  (g.__typeExplorerJobs = { jobs: new Map(), queue: [], active: 0 });

export function getJob(id: string): Job | undefined {
  return registry.jobs.get(id);
}

export function subscribe(
  id: string,
  listener: (e: ProgressEvent) => void,
): () => void {
  const job = registry.jobs.get(id);
  if (!job) return () => {};
  job.emitter.on("event", listener);
  return () => job.emitter.off("event", listener);
}

export function startJob(input: StartJobInput): SpecimenMeta {
  const id = randomUUID();
  const meta: SpecimenMeta = {
    id,
    title: `${input.display} × ${input.text}`,
    display: input.display,
    text: input.text,
    brief: input.brief,
    paletteMood: input.paletteMood,
    createdAt: new Date().toISOString(),
    status: "running",
  };

  const job: Job = { id, meta, events: [], emitter: new EventEmitter(), done: false };
  job.emitter.setMaxListeners(0);
  registry.jobs.set(id, job);

  // Persist the running record so it shows in the index immediately.
  void upsertSpecimen(meta);

  registry.queue.push(id);
  pump();

  return meta;
}

/** Start as many queued jobs as the concurrency limit allows. */
function pump(): void {
  while (registry.active < MAX_CONCURRENT && registry.queue.length > 0) {
    const id = registry.queue.shift()!;
    const job = registry.jobs.get(id);
    if (!job) continue;
    registry.active++;
    void runJob(job).finally(() => {
      registry.active--;
      pump();
    });
  }
}

function footerHtml(meta: SpecimenMeta): string {
  const parts = [
    fmtDuration(meta.durationMs),
    fmtCost(meta.costUsd) ? `${fmtCost(meta.costUsd)} API cost` : "",
  ].filter(Boolean);
  const date = new Date(meta.createdAt).toISOString().slice(0, 10);
  const meta_line = [`Generated ${date}`, ...parts].join(" · ");
  return `${FOOTER_MARKER}<div style="font:12px ui-monospace,SFMono-Regular,Menlo,monospace;opacity:.6;padding:14px 16px;text-align:center">${meta_line} · Type Explorer · ${REPO_URL}</div>`;
}

async function runJob(job: Job): Promise<void> {
  const startedAt = Date.now();
  const emit = (e: ProgressEvent) => {
    job.events.push(e);
    job.emitter.emit("event", e);
  };

  const result = await runGeneration({
    display: job.meta.display,
    text: job.meta.text,
    brief: job.meta.brief,
    paletteMood: job.meta.paletteMood,
    outFile: specimenHtmlPath(job.id),
    appRoot: process.cwd(),
    onEvent: emit,
  });

  job.meta = {
    ...job.meta,
    status: result.ok ? "done" : "error",
    error: result.error,
    costUsd: result.costUsd,
    durationMs: Date.now() - startedAt,
  };

  // Bake a small metadata footer into the saved file (post-processing pattern).
  if (result.ok) {
    const html = await readSpecimenHtml(job.id);
    if (html && !html.includes(FOOTER_MARKER)) {
      const out = html.replace(/<\/body>/i, `${footerHtml(job.meta)}</body>`);
      await writeSpecimenHtml(job.id, out);
    }
  }

  job.done = true;
  await upsertSpecimen(job.meta);

  // Drop the buffer/emitter after a grace period so a just-finished client
  // can still attach and replay the final events.
  setTimeout(() => registry.jobs.delete(job.id), 60_000).unref?.();
}
