import { promises as fs } from "fs";
import path from "path";
import type { SpecimenMeta } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const SPECIMENS_DIR = path.join(DATA_DIR, "specimens");
const INDEX_FILE = path.join(DATA_DIR, "index.json");

async function ensureDirs(): Promise<void> {
  await fs.mkdir(SPECIMENS_DIR, { recursive: true });
}

export function specimenHtmlPath(id: string): string {
  return path.join(SPECIMENS_DIR, `${id}.html`);
}

export async function readIndex(): Promise<SpecimenMeta[]> {
  try {
    const raw = await fs.readFile(INDEX_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SpecimenMeta[]) : [];
  } catch {
    return [];
  }
}

async function writeIndex(list: SpecimenMeta[]): Promise<void> {
  await ensureDirs();
  await fs.writeFile(INDEX_FILE, JSON.stringify(list, null, 2), "utf8");
}

/** Insert or update a specimen record, keeping the list newest-first. */
export async function upsertSpecimen(meta: SpecimenMeta): Promise<void> {
  const list = await readIndex();
  const idx = list.findIndex((s) => s.id === meta.id);
  if (idx === -1) list.unshift(meta);
  else list[idx] = meta;
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  await writeIndex(list);
}

export async function getSpecimen(id: string): Promise<SpecimenMeta | undefined> {
  const list = await readIndex();
  return list.find((s) => s.id === id);
}

export async function deleteSpecimen(id: string): Promise<boolean> {
  const list = await readIndex();
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  list.splice(idx, 1);
  await writeIndex(list);
  await fs.rm(specimenHtmlPath(id), { force: true });
  return true;
}

export async function readSpecimenHtml(id: string): Promise<string | undefined> {
  try {
    return await fs.readFile(specimenHtmlPath(id), "utf8");
  } catch {
    return undefined;
  }
}

export async function writeSpecimenHtml(id: string, html: string): Promise<void> {
  await ensureDirs();
  await fs.writeFile(specimenHtmlPath(id), html, "utf8");
}
