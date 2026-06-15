"use client";

import { useSyncExternalStore } from "react";
import type { FontFamily, Pairing } from "./types";

/**
 * Local-only favorites: the user grazes the catalog and the home page and
 * collects whatever catches their eye. Two kinds of object — single fonts (by
 * family name) and curated pairings (by id). Persisted to localStorage; no
 * backend. Components read reactively via `useFavorites()`.
 */

export interface Favorites {
  fonts: FontFamily[];
  pairings: Pairing[];
}

const KEY = "type-explorer:favorites";
const EMPTY: Favorites = { fonts: [], pairings: [] };

// Cached snapshot so useSyncExternalStore gets a stable reference between writes.
let cache: Favorites | null = null;
const listeners = new Set<() => void>();

function read(): Favorites {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<Favorites>;
    return { fonts: p.fonts ?? [], pairings: p.pairings ?? [] };
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): Favorites {
  if (cache === null) cache = read();
  return cache;
}

function getServerSnapshot(): Favorites {
  return EMPTY;
}

function write(next: Favorites): void {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage disabled — keep working in-memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Keep multiple tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = read();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Reactive favorites snapshot. */
export function useFavorites(): Favorites {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function isFontFavorite(favorites: Favorites, family: string): boolean {
  return favorites.fonts.some((f) => f.family === family);
}

export function isPairingFavorite(favorites: Favorites, id: string): boolean {
  return favorites.pairings.some((p) => p.id === id);
}

export function toggleFontFavorite(font: FontFamily): void {
  const cur = getSnapshot();
  const exists = cur.fonts.some((f) => f.family === font.family);
  write({
    ...cur,
    fonts: exists
      ? cur.fonts.filter((f) => f.family !== font.family)
      : [font, ...cur.fonts],
  });
}

export function togglePairingFavorite(pairing: Pairing): void {
  const cur = getSnapshot();
  const exists = cur.pairings.some((p) => p.id === pairing.id);
  write({
    ...cur,
    pairings: exists
      ? cur.pairings.filter((p) => p.id !== pairing.id)
      : [pairing, ...cur.pairings],
  });
}
