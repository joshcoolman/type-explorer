import type { CardTheme, PageChrome } from "@/lib/card-themes";

/**
 * The palette key beneath a composed page: a label, then one row of swatches.
 *
 * Not a theme editor and not a spec sheet — it's the composition naming its own
 * colors. It exists for the revision loop: a person can't say "make that red
 * darker" without seeing the red isolated from the sentence it's setting, and the
 * hex under each swatch is exactly what goes back into the URL.
 *
 * Shows the *effective* color per element rather than the four palette roles.
 * `theme=subtitle:A32B25` means the deck is red while `muted` is still grey; a key
 * showing `muted` would describe the palette instead of the page.
 *
 * The page field sits in the same row rather than in its own group — it's one more
 * specified color, and giving it a section of its own made the key look like a
 * document with parts.
 */

function swatchesFor(theme: CardTheme, page: PageChrome) {
  return [
    { role: "bg", hex: theme.bg },
    { role: "title", hex: theme.title ?? theme.fg },
    { role: "subtitle", hex: theme.subtitle ?? theme.muted },
    { role: "paragraph", hex: theme.paragraph ?? theme.muted },
    { role: "accent", hex: theme.accent },
    { role: "page", hex: page.bg },
  ];
}

export default function ComposeColorKey({
  themes,
  page,
}: {
  /** One theme per card. Identical palettes collapse to a single row. */
  themes: CardTheme[];
  page: PageChrome;
}) {
  // Cards usually share one palette, so a row per card would just repeat itself.
  // When they genuinely differ (a `mood`), each distinct palette gets its own row.
  const distinct: CardTheme[] = [];
  for (const theme of themes) {
    if (!distinct.some((t) => JSON.stringify(t) === JSON.stringify(theme))) {
      distinct.push(theme);
    }
  }

  return (
    <section
      className="mt-16 border-t pt-8"
      style={{ borderColor: page.rule }}
      aria-label="Color key"
    >
      <h2
        className="font-mono text-[11px] uppercase tracking-[0.16em]"
        style={{ color: page.muted }}
      >
        Colors
      </h2>

      <div className="mt-5 space-y-6">
        {distinct.map((theme, i) => (
          <div key={i} className="flex flex-wrap gap-px">
            {swatchesFor(theme, page).map((s) => (
              <div key={s.role} className="w-[4.5rem] min-w-0">
                <div
                  className="aspect-square w-full"
                  // A hairline keeps a near-black or near-white swatch from
                  // dissolving into the field behind it.
                  style={{ background: s.hex, outline: `1px solid ${page.rule}` }}
                />
                <div
                  className="mt-1.5 truncate text-center font-mono text-[9px] uppercase tracking-wider"
                  style={{ color: page.muted }}
                >
                  {s.role}
                </div>
                <div
                  className="truncate text-center font-mono text-[9px] uppercase"
                  style={{ color: page.muted, opacity: 0.65 }}
                >
                  {s.hex.replace("#", "")}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
