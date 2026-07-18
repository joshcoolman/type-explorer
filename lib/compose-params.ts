/**
 * The `/compose` param grammar: parse, validate, clamp, default, canonicalize.
 *
 * Everything correctness-critical about the compose surface lives here, and it is
 * pure — no React, no catalog import, no I/O. The caller supplies a font resolver,
 * so this file is unit-testable against a two-font fixture.
 *
 * Two rules shape every decision below:
 *
 *  1. **It never fails.** A composed URL is written by hand, by an agent that
 *     usually cannot see its output, on behalf of a user who will click the link
 *     in front of them. So a bad font slug drops that card, a bad hex falls back
 *     to a curated palette, an over-long title truncates — and each of those is
 *     recorded in `notes`. Nothing throws, nothing blank-pages.
 *  2. **It says what it did.** `notes` is the machine-readable degradation report
 *     the page renders at `#agent-notes`. Without it, an agent fetching its own
 *     URL back is just re-reading its own input.
 *
 * Deliberate asymmetry with `/api/fonts`, which *surfaces* unknown params in an
 * `ignored[]` array: a data query that silently lies is poison, but a rendering
 * surface that refuses to render is worse than one that renders a little less.
 */

import type { CardTheme, ResolvedCardTheme } from "./card-themes";
import {
  CARD_THEMES,
  resolveTheme,
  completePageChrome,
  completeTheme,
  derivePageChrome,
  isMood,
  themesForMood,
  type Mood,
  type PageChrome,
} from "./card-themes";
import { HEX_RE, normalizeHex } from "./color";
import { note, type Note } from "./compose-notes";
import { slugify } from "./slug";
import type { FontFamily, VoiceCopy } from "./types";

/** Resolve a font slug (per `lib/slug.ts`) to a catalog family, or null. */
export type FontResolver = (slug: string) => FontFamily | null;

export interface ComposePair {
  /** The heading voice. */
  display: FontFamily;
  /** The reading voice. Equal to `display` for a single-font (monovoice) card. */
  text: FontFamily;
  /** True when one family carries both roles. */
  monovoice: boolean;
  /**
   * 0-based position in the `pairs=` param as written, which is NOT the render
   * position once a card drops. A user saying "the third one" means the third
   * thing the agent asked for; if card two was dropped for an unknown slug, that
   * is render index 1. Carrying both is what keeps the reference honest.
   */
  requestedIndex: number;
}

/** Resolved type sizes in px, with leading derived per role. */
export interface ComposeSizes {
  h1: number;
  h2: number;
  p: number;
  h1Leading: number;
  h2Leading: number;
  pLeading: number;
  /** Paragraph measure in `ch`. */
  measureCh: number;
  /** Card padding in rem. */
  padding: number;
  /** Weight for the display voice; the text voice is always 400. */
  displayWeight: number;
}

export interface ComposeSpec {
  pairs: ComposePair[];
  /** One fully-resolved theme per pair, same order — every slot painted. */
  themes: ResolvedCardTheme[];
  /**
   * The viewport: page field, nav, footer. Derived from the first card theme
   * unless `page` says otherwise, so a light composition gets a light page for
   * free rather than being stranded on a fixed dark field.
   */
  pageChrome: PageChrome;
  voice: VoiceCopy;
  /** The `for` param — what the page is framing. */
  framing: string | null;
  sizes: ComposeSizes;
  /** Degradation report. Empty means everything parsed as written. */
  notes: Note[];
  /** Params we don't know, echoed so the agent can spot a typo'd key. */
  ignored: string[];
  /**
   * Per card, the color roles the URL actually named — parallel to `themes`.
   *
   * The render path doesn't need this; `/compose.json` does. A stated hex is the
   * user's intention and rendered untouched, so a consumer can tell "pin these,
   * regenerate the rest" — which is the one thing the HTML handoff can't say.
   */
  statedRoles: string[][];
  /** Stable re-serialization of the resolved spec — the CDN cache key. */
  canonical: string;
}

const MAX_PAIRS = 4;

/** Free-text caps. A headline and a paragraph, never an essay. */
const CAPS = { title: 120, subtitle: 200, paragraph: 600, for: 150 } as const;

/** Dial ranges — every dial is 1..5 with 3 as the neutral middle. */
const DIAL_MIN = 1;
const DIAL_MAX = 5;
const DIAL_DEFAULT = 3;

const SCALE_STEPS = [0.8, 0.9, 1, 1.15, 1.35];
const PADDING_STEPS = [1.5, 2, 2.5, 3, 3.5];
const MEASURE_STEPS = [38, 48, 58, 68, 78];
const WEIGHT_STEPS = [500, 600, 700, 800, 900];

const BASE = { h1: 36, h2: 20, p: 14 } as const;

/** Absolute-override clamps. `h1=800` becomes the max, with a note. */
const OVERRIDE_BOUNDS = {
  h1: [24, 120],
  h2: [14, 64],
  p: [11, 28],
} as const;

const KNOWN_PARAMS = new Set([
  "pairs",
  "theme",
  "themes",
  "page",
  "mood",
  "for",
  "title",
  "subtitle",
  "paragraph",
  "scale",
  "density",
  "contrast",
  "measure",
  "h1",
  "h2",
  "p",
  // Not a compose param, but `?strict=1` is real on every /api route. An agent
  // carrying it over here shouldn't be told it made a mistake — /compose has no
  // strict mode by design (rule 1: it never fails), so it's simply inert.
  "strict",
]);

/**
 * A URL inside free text is the phishing tell — our domain would be lending
 * credibility to someone else's link.
 *
 * Matched against whole whitespace-delimited tokens, not as a substring: stripping
 * a `https://` prefix in place would leave `evil.example` sitting in the copy,
 * which is the readable half of the problem. The whole token goes.
 *
 * `[a-z]{2,}` as the TLD rather than a fixed list — a list is a maintenance trap
 * and misses exactly the unfamiliar TLDs worth being suspicious of. False
 * positives cost a word of a headline; false negatives cost our credibility.
 */
const URLISH_TOKEN_RE =
  /^(https?:\/\/\S+|www\.\S+|[a-z0-9][a-z0-9-]*\.[a-z]{2,}(\/\S*)?)$/i;

/**
 * `+` decodes to a space in a query string, so `pairs=gloock+inter` arrives as
 * `"gloock inter"`. Both forms are accepted; slugs never contain either.
 */
/**
 * The resolver forgives near misses (see `lib/font-match.ts`), so a slug can
 * resolve to a family it doesn't spell. Rule 2 says we report that.
 */
function noteNearMatch(asked: string, got: FontFamily, notes: Note[]): void {
  if (asked.trim().toLowerCase() === slugify(got.family)) return;
  notes.push(
    note(
      "slug_resolved",
      "info",
      asked,
      `pairs: "${asked}" is not a slug we know — rendered ${got.family}, the nearest match`,
    ),
  );
}

function splitPair(chunk: string): string[] {
  return chunk.split(/[+\s]+/).map((s) => s.trim()).filter(Boolean);
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Read a 1..5 dial, defaulting on anything unparseable. */
function readDial(raw: string | null, name: string, notes: Note[]): number {
  if (raw === null || raw.trim() === "") return DIAL_DEFAULT;
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    notes.push(
      note("value_clamped", "info", name, `${name}: "${raw}" is not a number — using the default (${DIAL_DEFAULT})`),
    );
    return DIAL_DEFAULT;
  }
  const clamped = clampInt(n, DIAL_MIN, DIAL_MAX);
  if (clamped !== n) {
    notes.push(
      note("value_clamped", "info", name, `${name}: ${raw} is outside ${DIAL_MIN}-${DIAL_MAX} — clamped to ${clamped}`),
    );
  }
  return clamped;
}

/** Read an absolute px override. Returns null when absent, so `scale` still applies. */
function readOverride(
  raw: string | null,
  name: keyof typeof OVERRIDE_BOUNDS,
  notes: Note[],
): number | null {
  if (raw === null || raw.trim() === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    notes.push(
      note("value_clamped", "info", name, `${name}: "${raw}" is not a number — ignored, falling back to scale`),
    );
    return null;
  }
  const [min, max] = OVERRIDE_BOUNDS[name];
  const clamped = clampInt(n, min, max);
  if (clamped !== n) {
    notes.push(
      note("value_clamped", "info", name, `${name}: ${raw}px is outside ${min}-${max}px — clamped to ${clamped}px`),
    );
  }
  return clamped;
}

/** Cap free text and strip URLs, reporting both. */
function readText(
  raw: string | null,
  name: keyof typeof CAPS,
  notes: Note[],
): string {
  if (raw === null) return "";
  let text = raw.replace(/\s+/g, " ").trim();
  if (!text) return "";
  const tokens = text.split(" ");
  const kept = tokens.filter((t) => !URLISH_TOKEN_RE.test(t.replace(/[.,;:!?]+$/, "")));
  if (kept.length !== tokens.length) {
    text = kept.join(" ").trim();
    notes.push(
      note("url_stripped", "warn", name, `${name}: a URL was removed — composed pages don't carry outbound links`),
    );
  }
  const cap = CAPS[name];
  if (text.length > cap) {
    text = `${text.slice(0, cap - 1).trimEnd()}…`;
    notes.push(
      note("text_truncated", "warn", name, `${name}: longer than ${cap} characters — truncated`),
    );
  }
  return text;
}

/** Leading is derived from size, never supplied: the template owns rhythm. */
function leadingFor(role: "h1" | "h2" | "p", size: number): number {
  const raw =
    role === "h1"
      ? 1.32 - size * 0.006
      : role === "h2"
        ? 1.5 - size * 0.008
        : 1.85 - size * 0.018;
  const floor = role === "h1" ? 1 : role === "h2" ? 1.15 : 1.4;
  return Math.round(Math.max(floor, Math.min(1.7, raw)) * 100) / 100;
}

function parsePairs(
  raw: string | null,
  resolve: FontResolver,
  notes: Note[],
): ComposePair[] {
  if (!raw || !raw.trim()) return [];
  const chunks = raw.split(",").map((c) => c.trim()).filter(Boolean);
  if (chunks.length > MAX_PAIRS) {
    notes.push(
      note(
        "pairs_truncated",
        "warn",
        "pairs",
        `pairs: ${chunks.length} given, ${MAX_PAIRS} is the maximum — the extra ${chunks.length - MAX_PAIRS} were dropped`,
      ),
    );
  }
  const pairs: ComposePair[] = [];
  for (const [requestedIndex, chunk] of chunks.slice(0, MAX_PAIRS).entries()) {
    const slugs = splitPair(chunk);
    if (!slugs.length) continue;
    const display = resolve(slugs[0]);
    if (!display) {
      notes.push(
        note(
          "card_dropped",
          "warn",
          slugs[0],
          `pairs: "${slugs[0]}" is not a known font slug — that card was dropped`,
        ),
      );
      continue;
    }
    noteNearMatch(slugs[0], display, notes);
    // A lone slug is a valid monovoice card, not an error.
    let text = display;
    if (slugs.length > 1) {
      const resolved = resolve(slugs[1]);
      if (resolved) {
        text = resolved;
        noteNearMatch(slugs[1], resolved, notes);
      } else {
        notes.push(
          note(
            "font_substituted",
            "warn",
            slugs[1],
            `pairs: "${slugs[1]}" is not a known font slug — that card fell back to ${display.family} for both roles`,
          ),
        );
      }
    }
    if (slugs.length > 2) {
      notes.push(
        note(
          "pairs_truncated",
          "warn",
          chunk,
          `pairs: "${chunk}" names more than two fonts — only the first two were used`,
        ),
      );
    }
    pairs.push({ display, text, monovoice: text.family === display.family, requestedIndex });
  }
  return pairs;
}

/**
 * Parse a single theme spec — a curated index (`3`) or named custom roles
 * (`bg:212121,accent:E34712`). Returns null when the spec holds nothing usable,
 * so the caller can fall back. This is the shared unit behind both the single
 * `theme=` param and each item of the `themes=` per-card list.
 */
function parseOneTheme(spec: string, notes: Note[]): ThemeSpec | null {
  const value = spec.trim();
  if (!value) return null;
  if (/^\d+$/.test(value)) {
    const i = Number(value);
    if (i < CARD_THEMES.length) return curated(CARD_THEMES[i]);
    const wrapped = i % CARD_THEMES.length;
    notes.push(
      note(
        "value_clamped",
        "info",
        "theme",
        `theme: index ${i} is past the ${CARD_THEMES.length} curated palettes — wrapped to ${wrapped}`,
      ),
    );
    return curated(CARD_THEMES[wrapped]);
  }
  return parseCustomTheme(value, notes);
}

/** A curated palette states nothing — every role is ours, so provenance is empty. */
function curated(theme: CardTheme): ThemeSpec {
  return { theme, stated: [] };
}

/**
 * Resolve the palette sequence the cards walk. Three ways in, in precedence
 * order: an explicit bring-your-own theme, a curated index, a mood. Anything
 * unrecognized falls through to the full curated set, which is also the default.
 */
function parseThemes(
  themeRaw: string | null,
  moodRaw: string | null,
  count: number,
  notes: Note[],
): ThemeSpec[] {
  let sequence: ThemeSpec[] | null = null;

  const theme = themeRaw?.trim() ?? "";
  if (theme) {
    const one = parseOneTheme(theme, notes);
    if (one) sequence = [one];
  }

  if (!sequence) {
    const mood = moodRaw?.trim().toLowerCase() ?? "";
    if (mood) {
      if (isMood(mood)) {
        sequence = themesForMood(mood as Mood).map(curated);
      } else {
        notes.push(
          note(
            "theme_fallback",
            "warn",
            "mood",
            `mood: "${mood}" is not one of subtle, bold, warm, cool — using the full curated set`,
          ),
        );
      }
    }
  }

  const source = sequence ?? CARD_THEMES.map(curated);
  return Array.from({ length: Math.max(count, 1) }, (_, i) => source[i % source.length]);
}

/**
 * Per-card palettes: `themes=<spec>;<spec>;…`, one palette per pairing card, so
 * three cards can carry three distinct looks in a single URL. `;` separates the
 * list; `,` stays role-internal, and each spec is the identical grammar as a
 * single `theme=` value.
 *
 * Same never-fail contract as everything else: one spec applies to every card, N
 * map by card index, fewer-than-cards cycle, and an unusable spec falls back to a
 * curated palette with a note. `themes=` takes precedence over `theme=`/`mood=`.
 */
function parseThemesList(
  raw: string,
  count: number,
  notes: Note[],
): ThemeSpec[] {
  const specs = raw.split(";").map((s) => s.trim()).filter(Boolean);
  const parsed = specs.map((spec, i) => {
    const one = parseOneTheme(spec, notes);
    if (one) return one;
    notes.push(
      note(
        "theme_fallback",
        "warn",
        `themes[${i}]`,
        `themes: palette ${i + 1} ("${spec}") had nothing usable — fell back to a curated palette`,
      ),
    );
    return curated(CARD_THEMES[i % CARD_THEMES.length]);
  });
  const source = parsed.length ? parsed : CARD_THEMES.map(curated);
  return Array.from({ length: Math.max(count, 1) }, (_, i) => source[i % source.length]);
}

/**
 * The color roles a `theme=` value may name. `bg`/`fg`/`muted`/`accent` are the
 * palette; `title`/`subtitle`/`paragraph` override a single text element and fall
 * back to the palette when absent.
 */
const THEME_ROLES = new Set([
  "bg",
  "fg",
  "muted",
  "accent",
  "title",
  "subtitle",
  "paragraph",
  "rule",
  "label",
]);

/**
 * Resolve the viewport chrome. Derived from the cards by default; `page` overrides
 * either wholesale (`page=bg:FAF7F0,fg:2C2824`) or as a bare background
 * (`page=FAF7F0`), which is the common case — an agent usually knows the field it
 * wants and not much else.
 */
function parsePageChrome(
  raw: string | null,
  card: CardTheme,
  notes: Note[],
): PageChrome {
  const derived = derivePageChrome(card);
  const value = raw?.trim() ?? "";
  if (!value) return derived;

  // Bare hex shorthand: the background alone, everything else derived from it.
  if (HEX_RE.test(value.replace(/^#/, ""))) {
    const { chrome, notes: n } = completePageChrome(
      { bg: normalizeHex(value)! },
      derived,
    );
    notes.push(...n);
    return chrome;
  }

  const partial: Partial<PageChrome> = {};
  let sawAny = false;
  for (const part of value.split(",")) {
    const [key, val] = part.split(":").map((s) => s?.trim() ?? "");
    const role = key.toLowerCase();
    if (role !== "bg" && role !== "fg" && role !== "muted" && role !== "accent") {
      notes.push(
        note("param_ignored", "info", key, `page: "${key}" is not a page role (bg, fg, muted, accent) — ignored`),
      );
      continue;
    }
    if (!val || !HEX_RE.test(val.replace(/^#/, ""))) {
      notes.push(
        note("hex_invalid", "warn", role, `page: ${role}="${val}" is not a hex color — that role was derived instead`),
      );
      continue;
    }
    partial[role] = normalizeHex(val)!;
    sawAny = true;
  }

  if (!sawAny) {
    notes.push(
      note("theme_fallback", "warn", "page", "page: nothing usable — the viewport was derived from the cards"),
    );
    return derived;
  }
  const { chrome, notes: n } = completePageChrome(partial, derived);
  notes.push(...n);
  return chrome;
}

/** `bg:212121,accent:E34712` — named, never positional, and completed by our taste. */
/**
 * A parsed palette plus the roles the URL actually named. The stated set is what
 * `/compose.json` reports as provenance: those hexes are the user's intention and
 * render untouched, everything else we filled.
 */
export interface ThemeSpec {
  theme: CardTheme;
  /** Role names present in the URL, e.g. ["bg", "fg", "accent"]. */
  stated: string[];
}

function parseCustomTheme(raw: string, notes: Note[]): ThemeSpec | null {
  const partial: Partial<CardTheme> = {};
  let sawAny = false;

  for (const part of raw.split(",")) {
    const [key, value] = part.split(":").map((s) => s?.trim() ?? "");
    if (!key) continue;
    const role = key.toLowerCase();
    if (!THEME_ROLES.has(role)) {
      notes.push(
        note(
          "param_ignored",
          "info",
          key,
          `theme: "${key}" is not a color role (${[...THEME_ROLES].join(", ")}) — ignored`,
        ),
      );
      continue;
    }
    if (!value || !HEX_RE.test(value.replace(/^#/, ""))) {
      notes.push(
        note("hex_invalid", "warn", role, `theme: ${role}="${value}" is not a hex color — that role was derived instead`),
      );
      continue;
    }
    partial[role as keyof CardTheme] = normalizeHex(value)!;
    sawAny = true;
  }

  if (!sawAny) {
    notes.push(
      note(
        "theme_fallback",
        "warn",
        "theme",
        "theme: nothing usable in the custom palette — fell back to the curated set",
      ),
    );
    return null;
  }
  const { theme, notes: themeNotes } = completeTheme(partial);
  notes.push(...themeNotes);
  return { theme, stated: Object.keys(partial) };
}

/**
 * Canonical re-serialization: fixed key order, resolved values, omitted defaults.
 * Vercel's CDN keys on the full URL including query, so two agents writing the
 * same page different ways only share a cache entry because of this.
 */
function canonicalize(
  spec: Omit<ComposeSpec, "canonical">,
  dials: { scale: number; density: number; contrast: number; measure: number },
  overrides: { h1: number | null; h2: number | null; p: number | null },
  themesRaw: string | null,
  themeRaw: string | null,
  moodRaw: string | null,
): string {
  const parts: string[] = [];
  const add = (key: string, value: string) =>
    parts.push(`${key}=${encodeURIComponent(value)}`);

  if (spec.pairs.length) {
    add(
      "pairs",
      spec.pairs
        .map((p) => (p.monovoice ? slugOf(p.display) : `${slugOf(p.display)}+${slugOf(p.text)}`))
        .join(","),
    );
  }
  if (themesRaw?.trim()) add("themes", themesRaw.trim());
  else if (themeRaw?.trim()) add("theme", themeRaw.trim());
  else if (moodRaw?.trim().toLowerCase() && isMood(moodRaw.trim().toLowerCase())) {
    add("mood", moodRaw.trim().toLowerCase());
  }
  if (spec.voice.title) add("title", spec.voice.title);
  if (spec.voice.subtitle) add("subtitle", spec.voice.subtitle);
  if (spec.voice.paragraph) add("paragraph", spec.voice.paragraph);
  if (spec.framing) add("for", spec.framing);
  for (const [key, value] of Object.entries(dials)) {
    if (value !== DIAL_DEFAULT) add(key, String(value));
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value !== null) add(key, String(value));
  }
  return parts.join("&");
}

function slugOf(family: FontFamily): string {
  return slugify(family.family);
}

export function parseComposeParams(
  params: URLSearchParams,
  resolve: FontResolver,
): ComposeSpec {
  const notes: Note[] = [];

  const ignored = [...new Set([...params.keys()])].filter((k) => !KNOWN_PARAMS.has(k));
  for (const key of ignored) {
    notes.push(note("param_ignored", "info", key, `"${key}" is not a compose parameter — ignored`));
  }

  const pairs = parsePairs(params.get("pairs"), resolve, notes);
  if (!pairs.length) {
    notes.push(
      note(
        "pairs_fallback",
        "warn",
        "pairs",
        "pairs: nothing resolvable — showing the site's default direction instead",
      ),
    );
  }

  const count = pairs.length || 1;
  const themesRaw = params.get("themes");
  if (themesRaw?.trim() && params.get("theme")?.trim()) {
    notes.push(
      note(
        "param_ignored",
        "info",
        "theme",
        "themes and theme were both given — themes (per-card) wins",
      ),
    );
  }
  // One resolve pass over every card, whatever produced it. Curated palettes go
  // through the same door as hand-written ones, so `theme=3` gets an accent-borne
  // subtitle and a distinct paragraph exactly like `theme=bg:…,accent:…` does.
  const themeSpecs = themesRaw?.trim()
    ? parseThemesList(themesRaw, count, notes)
    : parseThemes(params.get("theme"), params.get("mood"), count, notes);
  const themes = themeSpecs.map((t) => resolveTheme(t.theme));
  const statedRoles = themeSpecs.map((t) => t.stated);

  const voice: VoiceCopy = {
    title: readText(params.get("title"), "title", notes),
    subtitle: readText(params.get("subtitle"), "subtitle", notes),
    paragraph: readText(params.get("paragraph"), "paragraph", notes),
  };

  const framing = readText(params.get("for"), "for", notes) || null;

  const dials = {
    scale: readDial(params.get("scale"), "scale", notes),
    density: readDial(params.get("density"), "density", notes),
    contrast: readDial(params.get("contrast"), "contrast", notes),
    measure: readDial(params.get("measure"), "measure", notes),
  };

  const overrides = {
    h1: readOverride(params.get("h1"), "h1", notes),
    h2: readOverride(params.get("h2"), "h2", notes),
    p: readOverride(params.get("p"), "p", notes),
  };

  const mult = SCALE_STEPS[dials.scale - 1];
  const h1 = overrides.h1 ?? Math.round(BASE.h1 * mult);
  const h2 = overrides.h2 ?? Math.round(BASE.h2 * mult);
  const p = overrides.p ?? Math.round(BASE.p * mult);

  const sizes: ComposeSizes = {
    h1,
    h2,
    p,
    h1Leading: leadingFor("h1", h1),
    h2Leading: leadingFor("h2", h2),
    pLeading: leadingFor("p", p),
    measureCh: MEASURE_STEPS[dials.measure - 1],
    padding: PADDING_STEPS[dials.density - 1],
    displayWeight: WEIGHT_STEPS[dials.contrast - 1],
  };

  const pageChrome = parsePageChrome(params.get("page"), themes[0], notes);

  const base: Omit<ComposeSpec, "canonical"> = {
    pairs,
    themes,
    statedRoles,
    pageChrome,
    voice,
    framing,
    sizes,
    notes,
    ignored,
  };

  return {
    ...base,
    canonical: canonicalize(
      base,
      dials,
      overrides,
      params.get("themes"),
      params.get("theme"),
      params.get("mood"),
    ),
  };
}
