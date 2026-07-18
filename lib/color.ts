/**
 * Small, dependency-free color math — the arithmetic behind agent-supplied
 * palettes on `/compose`.
 *
 * Kept separate from `lib/card-themes.ts` on purpose: this file knows nothing
 * about our palettes, only about hexes and WCAG ratios. The *policy* (which role
 * needs which ratio, what to derive when a role is missing) lives in
 * `card-themes.ts`, so taste and math don't tangle.
 *
 * WCAG SC 1.4.3: 4.5:1 for normal text, 3:1 for large text (>=24px regular).
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** The only shape we ever accept from a URL — checked before any interpolation. */
export const HEX_RE = /^[0-9a-fA-F]{3,8}$/;

/**
 * Parse a bare hex body (no `#`) in 3/4/6/8-digit form. Alpha digits are parsed
 * and discarded — a composed page has no use for translucent roles, and silently
 * dropping alpha beats rejecting a URL an agent wrote in good faith.
 */
export function parseHex(input: string): Rgb | null {
  const body = input.trim().replace(/^#/, "");
  if (!HEX_RE.test(body)) return null;
  const expand = (s: string) => s.split("").map((c) => c + c).join("");
  let six: string;
  switch (body.length) {
    case 3:
      six = expand(body);
      break;
    case 4:
      six = expand(body.slice(0, 3));
      break;
    case 6:
      six = body;
      break;
    case 8:
      six = body.slice(0, 6);
      break;
    default:
      return null; // 5 and 7 digits are typos, not shorthand
  }
  return {
    r: parseInt(six.slice(0, 2), 16),
    g: parseInt(six.slice(2, 4), 16),
    b: parseInt(six.slice(4, 6), 16),
  };
}

/** Canonical `#rrggbb`, lowercase. The only form we ever emit. */
export function toHex({ r, g, b }: Rgb): string {
  const h = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Normalize any accepted input to `#rrggbb`, or null if it isn't a hex. */
export function normalizeHex(input: string): string | null {
  const rgb = parseHex(input);
  return rgb ? toHex(rgb) : null;
}

/** WCAG relative luminance. */
export function luminance({ r, g, b }: Rgb): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio, 1..21. Order-independent. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Linear blend: `t=0` returns `a`, `t=1` returns `b`. */
export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  const k = Math.min(1, Math.max(0, t));
  return {
    r: a.r + (b.r - a.r) * k,
    g: a.g + (b.g - a.g) * k,
    b: a.b + (b.b - a.b) * k,
  };
}

/** True when `bg` is dark enough that light text belongs on it. */
export function isDark(bg: Rgb): boolean {
  return luminance(bg) < 0.4;
}

/**
 * Push `color` away from `bg` — toward white on a dark field, toward black on a
 * light one — until it clears `target`. Returns the original when it already
 * passes, and the extreme when the target is unreachable (a mid-grey `bg` cannot
 * support 4.5:1 in either direction; the closest legible value still beats an
 * error page).
 */
export function ensureContrast(color: Rgb, bg: Rgb, target: number): Rgb {
  if (contrastRatio(color, bg) >= target) return color;
  const pole: Rgb = isDark(bg) ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
  let best = color;
  let bestRatio = contrastRatio(color, bg);
  for (let i = 1; i <= 20; i++) {
    const candidate = mix(color, pole, i / 20);
    const ratio = contrastRatio(candidate, bg);
    if (ratio > bestRatio) {
      best = candidate;
      bestRatio = ratio;
    }
    if (ratio >= target) return candidate;
  }
  return best;
}
