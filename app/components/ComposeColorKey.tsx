import type { PageChrome, ResolvedCardTheme } from "@/lib/card-themes";

/**
 * The palette key beneath a composed page.
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
 * Two layouts, because the key is describing two different things:
 *
 * - **Per-card palettes** (`themes=`) — each palette sits in a column under the
 *   card it painted, sharing the card row's flex sizing so the columns line up.
 *   A single flat row would make the reader work out which swatch belongs where.
 * - **One shared palette** — describes the whole page, not any particular card,
 *   so there is nothing to align to. A left-aligned strip of fixed chips;
 *   stretching five swatches to a card's width just makes billboards.
 */

function swatchesFor(theme: ResolvedCardTheme) {
  return [
    { role: "bg", hex: theme.bg },
    { role: "title", hex: theme.title },
    { role: "subtitle", hex: theme.subtitle },
    { role: "paragraph", hex: theme.paragraph },
    { role: "accent", hex: theme.accent },
  ];
}

function Swatch({
  role,
  hex,
  page,
  stretch,
}: {
  role: string;
  hex: string;
  page: PageChrome;
  /** Fill the column (aligned under a card) vs. sit at a fixed chip size. */
  stretch?: boolean;
}) {
  return (
    <div className={stretch ? "min-w-0 flex-1" : "w-[4.5rem] min-w-0"}>
      <div
        className="aspect-square w-full"
        // A hairline keeps a near-black or near-white swatch from dissolving
        // into the field behind it.
        style={{ background: hex, outline: `1px solid ${page.rule}` }}
      />
      <div
        className="mt-1.5 truncate text-center font-mono text-[9px] uppercase tracking-wider"
        style={{ color: page.muted }}
      >
        {role}
      </div>
      <div
        className="truncate text-center font-mono text-[9px] uppercase"
        style={{ color: page.muted, opacity: 0.65 }}
      >
        {hex.replace("#", "")}
      </div>
    </div>
  );
}

/**
 * The page field is one color for the whole composition, so it gets a single
 * swatch rather than being repeated in every column — left-aligned under the
 * heading, since centered it reads as a column that lost its card.
 */
function PageSwatch({ page }: { page: PageChrome }) {
  return (
    <div className="mt-6 w-[4.5rem]">
      <Swatch role="page" hex={page.bg} page={page} />
    </div>
  );
}

export default function ComposeColorKey({
  themes,
  page,
}: {
  /** One theme per card, same order as the cards. */
  themes: ResolvedCardTheme[];
  page: PageChrome;
}) {
  const allSame = themes.every(
    (t) => JSON.stringify(t) === JSON.stringify(themes[0]),
  );

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

      {allSame ? (
        <div className="mt-5 flex flex-wrap gap-px">
          {swatchesFor(themes[0]).map((s) => (
            <Swatch key={s.role} role={s.role} hex={s.hex} page={page} />
          ))}
        </div>
      ) : (
        // Same container and column sizing as the card row, so a column lands
        // under the card it describes.
        <div className="mx-auto mt-5 flex w-full max-w-[92.5rem] flex-wrap justify-center gap-4 lg:gap-6">
          {themes.map((theme, i) => (
            <div
              key={i}
              className="flex w-full min-[49rem]:flex-1 min-[49rem]:min-w-[20rem]"
            >
              <div className="flex w-full gap-px">
                {swatchesFor(theme).map((s) => (
                  <Swatch
                    key={s.role}
                    role={s.role}
                    hex={s.hex}
                    page={page}
                    stretch
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <PageSwatch page={page} />
    </section>
  );
}
