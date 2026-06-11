"use client";

import type { PairingProposal, SavedPairing } from "./types";

/**
 * The Brief "pairing history" — proposals persisted to localStorage so they
 * survive tab switches and refreshes and accumulate value over time. Generated
 * specimens already persist server-side (data/index.json); this covers the
 * ungenerated ideas. Browser-only; every access is SSR-safe and best-effort.
 */

const KEY = "type-explorer:pairings";

/** Stable id for a pairing — the same `display|text` key used by the proposals call. */
export function pairingId(display: string, text: string): string {
  return `${display}|${text}`.toLowerCase();
}

export function loadPairings(): SavedPairing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedPairing[]) : [];
  } catch {
    return [];
  }
}

function persist(list: SavedPairing[]): SavedPairing[] {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(list));
    } catch {
      /* quota or disabled storage — keep working in-memory for this session */
    }
  }
  return list;
}

/**
 * Merge freshly-proposed pairings into the stored history, newest first.
 * A pairing already present (by id) is kept as-is so an existing specimen link
 * and original brief survive — re-proposing the same pair never clobbers it.
 */
export function addPairings(
  proposals: PairingProposal[],
  brief: string,
  lockedFont: string | undefined,
  createdAt: string,
): SavedPairing[] {
  const existing = loadPairings();
  const known = new Set(existing.map((p) => p.id));
  const fresh: SavedPairing[] = [];
  for (const p of proposals) {
    const id = pairingId(p.display, p.text);
    if (known.has(id)) continue;
    known.add(id);
    fresh.push({ ...p, id, brief, lockedFont, createdAt });
  }
  return persist([...fresh, ...existing]);
}

/** Link a pairing to the specimen job started from it. */
export function tagSpecimen(id: string, specimenId: string): SavedPairing[] {
  const list = loadPairings().map((p) =>
    p.id === id ? { ...p, specimenId } : p,
  );
  return persist(list);
}

export function removePairing(id: string): SavedPairing[] {
  return persist(loadPairings().filter((p) => p.id !== id));
}

export function clearPairings(): SavedPairing[] {
  return persist([]);
}
