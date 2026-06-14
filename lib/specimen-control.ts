"use client";

import { useEffect } from "react";
import type { RefObject } from "react";
import type { Palette } from "./types";
import { paletteToParam } from "./palette";

/**
 * The host → specimen control channel. Specimens render in sandboxed iframes
 * (no `allow-same-origin`), so we cannot touch their DOM. Instead:
 *   - the initial `src` carries `?theme=`/`?pal=` so the FIRST paint is correct
 *     (no flash); the specimen reads them in its <head> script;
 *   - subsequent live changes (mode flips, palette edits) are pushed with
 *     `postMessage` so the iframe never reloads.
 */
export interface SpecimenControl {
  mode: "light" | "dark";
  palette: Palette;
  paletteEnabled: boolean;
}

/** Initial iframe URL — encodes the control so first paint matches. */
export function specimenSrc(id: string, c: SpecimenControl): string {
  const params = new URLSearchParams({ theme: c.mode });
  if (c.paletteEnabled) params.set("pal", paletteToParam(c.palette));
  return `/api/specimens/${id}?${params.toString()}`;
}

/** Post the current control to a specimen window (no-op if not ready). */
export function postControl(win: Window | null | undefined, c: SpecimenControl): void {
  win?.postMessage(
    {
      type: "specimen-control",
      mode: c.mode,
      palette: c.paletteEnabled ? c.palette : null,
    },
    "*",
  );
}

/** Re-push control to the iframe whenever the live state changes. */
export function useSpecimenControl(
  ref: RefObject<HTMLIFrameElement | null>,
  control: SpecimenControl,
): void {
  useEffect(() => {
    postControl(ref.current?.contentWindow, control);
  }, [ref, control]);
}
