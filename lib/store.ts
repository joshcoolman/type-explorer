import { promises as fs } from "fs";
import path from "path";
import type { SpecimenMeta } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const SPECIMENS_DIR = path.join(DATA_DIR, "specimens");
const INDEX_FILE = path.join(DATA_DIR, "index.json");

// Pre-built specimens committed to the repo, copied into data/ on first run so a
// fresh clone opens with a populated Library. Pure file copy — no agent, no cost.
const SEED_DIR = path.join(process.cwd(), "seed");
const SEED_INDEX = path.join(SEED_DIR, "index.json");
const SEED_SPECIMENS_DIR = path.join(SEED_DIR, "specimens");

async function ensureDirs(): Promise<void> {
  await fs.mkdir(SPECIMENS_DIR, { recursive: true });
}

export function specimenHtmlPath(id: string): string {
  return path.join(SPECIMENS_DIR, `${id}.html`);
}

let seedChecked = false;

/**
 * On first read, if no data/index.json exists yet, copy the committed seed
 * specimens into data/ and write the manifest. Runs once per process and never
 * overwrites real data, so a user's own generations are untouched.
 */
async function seedIfEmpty(): Promise<void> {
  if (seedChecked) return;
  seedChecked = true;
  try {
    await fs.access(INDEX_FILE);
    return; // Library already has data — never seed over it.
  } catch {
    /* no index yet — candidate for seeding */
  }
  try {
    const raw = await fs.readFile(SEED_INDEX, "utf8");
    const seedList = JSON.parse(raw) as SpecimenMeta[];
    if (!Array.isArray(seedList) || seedList.length === 0) return;
    await ensureDirs();
    for (const meta of seedList) {
      try {
        await fs.copyFile(
          path.join(SEED_SPECIMENS_DIR, `${meta.id}.html`),
          specimenHtmlPath(meta.id),
        );
      } catch {
        /* a missing seed file shouldn't abort the rest */
      }
    }
    await fs.writeFile(INDEX_FILE, JSON.stringify(seedList, null, 2), "utf8");
  } catch {
    /* no seed dir / unreadable — nothing to seed, that's fine */
  }
}

export async function readIndex(): Promise<SpecimenMeta[]> {
  await seedIfEmpty();
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
