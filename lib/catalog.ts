import type { Catalog } from "./types";
import data from "../data/fonts.json";

/**
 * The font catalog is a static snapshot committed to the repo at
 * `data/fonts.json`, generated offline by `scripts/build-catalog.mjs`. Reading it
 * at runtime keeps the hosted app free of API keys and network calls.
 *
 * To refresh: run `npm run catalog:refresh` (needs a Google Fonts API key in
 * `.env.local`) and commit the updated `data/fonts.json`.
 */
const catalog = data as Catalog;

export async function getCatalog(): Promise<Catalog> {
  return catalog;
}
