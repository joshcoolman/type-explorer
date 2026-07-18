import type { Metadata } from "next";
import type { Note } from "@/lib/compose-notes";
import { resolveCompose, toSearchParams } from "@/lib/compose-resolve";
import { getFontResolver } from "@/lib/font-index";
import type { buildHandoff } from "@/lib/handoff";
import ComposeCard from "@/app/components/ComposeCard";
import ComposeColorKey from "@/app/components/ComposeColorKey";
import { Container, typeRole } from "@/app/components/ui";

/**
 * A composed type direction, addressed entirely by readable query params.
 *
 * The title is fixed and carries no user text on purpose. Free text from the URL
 * is the spoofing payload — and `<title>` plus OG meta are exactly what render as
 * a link preview in Slack and iMessage. Keeping the page's *chrome* ours means the
 * worst case is text on a page that visibly reads as a generated view.
 */
export const metadata: Metadata = {
  title: "Type direction — Type Explorer",
  description: "A composed display + text direction with paste-ready implementation config.",
  // Not a robots.txt Disallow: that would also block the legitimate fetch-back an
  // agent uses to verify its own URL. An unbounded parameterized route rendering
  // arbitrary text is infinite crawl space, so it stays out of the index only.
  robots: { index: false, follow: false },
};

/**
 * Visually hidden, but present in the DOM as text.
 *
 * Explicitly NOT `display: none` or the `hidden` attribute: both are commonly
 * dropped by HTML-to-text extractors, which is precisely the pipeline most agents
 * read this page through. The clip-rect technique renders nothing while keeping
 * the text in the document, so a converter still emits it.
 */
const VISUALLY_HIDDEN: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  borderWidth: 0,
};

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolve = await getFontResolver();
  const { spec, pairs, voice, handoff } = resolveCompose(
    toSearchParams(await searchParams),
    resolve,
  );

  const chrome = spec.pageChrome;
  const solo = pairs.length === 1;

  return (
    <main
      className="flex-1"
      style={{ background: chrome.bg, color: chrome.fg }}
    >
      {/* Fonts load from a real stylesheet link in the server-rendered markup, not
          an effect — so the page is correct on first paint and for any fetcher. */}
      {handoff.css2All && <link rel="stylesheet" href={handoff.css2All} />}

      {/*
        Paint the whole viewport, not just <main>. Without this the body shows
        through above and below the content — most visibly on a short page or past
        the end of a scroll — and a light composition would sit in a dark frame.
        The page field is part of the composition, so it has to reach the edges.
      */}
      <style>{`html,body{background:${chrome.bg};}`}</style>

      <Container className="pt-8 pb-16 sm:pt-10">
        {/*
          The only chrome a composed page carries: one line, in the UI mono face, of
          whatever the agent chose to call this. Not a page title — a margin note.
          It's the `for` param, which until now was parsed and homeless.
        */}
        {spec.framing && (
          <div
            className={`mb-10 ${typeRole.label}`}
            style={{ color: chrome.muted }}
          >
            {spec.framing}
          </div>
        )}

        {/*
          Centered at any count — deliberately not the shared `Grid`.
          That grid uses `auto-fill`, which materializes empty tracks to fill the
          width, so one or two cards sit in the leftmost track rather than centered;
          it only *looks* centered when the cards happen to fill a row. A composed
          page is routinely 1-3 cards (show three options, then iterate on the one
          that won), so off-center is the common case, not the edge case.

          Flex-wrap centers whatever is there. Fixed 22rem cards above the breakpoint
          keeps them the same size as everywhere else in the app — more cards, not
          wider ones — and `items-stretch` (the flex default) keeps a row level.
        */}
        <div className="mx-auto flex w-full max-w-[92.5rem] flex-wrap justify-center gap-4 lg:gap-6">
          {pairs.map((pair, i) => (
            <div
              key={`${pair.display.family}-${pair.text.family}-${i}`}
              className={
                // A lone card is the "iterate on the one that won" state, and at
                // 22rem it reads as an orphan of a grid that isn't there. Double the
                // width with a floor under the height so it stays a card rather than
                // collapsing into a strip once the copy stops wrapping.
                //
                // Two or more share the width instead of sitting at a fixed 22rem.
                // The card count here is chosen by the URL, not by how many fit, so
                // the browse grid's "more cards, not wider ones" logic doesn't apply
                // — leftover margin just reads as a truncated grid. Because the
                // container caps at 92.5rem this converges on the old fixed size as
                // the count rises: ~44rem at two, ~29rem at three, ~22rem at four.
                solo
                  ? "flex w-full min-[49rem]:w-[44rem] min-[49rem]:min-h-[26rem]"
                  : "flex w-full min-[49rem]:flex-1 min-[49rem]:min-w-[20rem]"
              }
            >
              <ComposeCard
                pair={pair}
                theme={spec.themes[i % spec.themes.length]}
                voice={voice}
                sizes={spec.sizes}
                ordinal={solo ? undefined : i + 1}
              />
            </div>
          ))}
        </div>

        <ComposeColorKey
          themes={pairs.map((_, i) => spec.themes[i % spec.themes.length])}
          page={chrome}
        />

        {/*
          The agent-facing payload: render notes and implementation config.

          Present in the DOM as real text, but visually hidden — it's addressed to
          the agent, and putting it on the page made a composed direction read as a
          spec sheet instead of a piece of design.

          Deliberately NOT an HTML comment, which was the obvious first instinct:
          most agents fetch through an HTML-to-markdown converter rather than
          reading raw HTML, and comments are stripped in that conversion. Hidden
          text survives it, because converters walk the DOM and don't compute CSS.

          `aria-hidden` because a screen-reader user is a *user* — they want the
          type direction, not a css2 URL read aloud.
        */}
        <div style={VISUALLY_HIDDEN} aria-hidden="true" data-agent-payload>
          <AgentNotes notes={spec.notes} canonical={spec.canonical} />
          <Specs handoff={handoff} />
        </div>
      </Container>
    </main>
  );
}

/**
 * The degradation report, at a stable `#agent-notes` anchor documented in
 * `/agent.md`.
 *
 * This is what makes fetch-back verification worth anything: an agent requesting
 * its own composed URL can otherwise only confirm that the server answered, not
 * that the page says what it meant. `data-status` carries an explicit `ok` when
 * nothing was dropped — silence would be indistinguishable from a parse the agent
 * never saw.
 */
function AgentNotes({ notes, canonical }: { notes: Note[]; canonical: string }) {
  return (
    <section
      id="agent-notes"
      data-status={notes.length ? "degraded" : "ok"}
      data-note-count={notes.length}
      className="mt-16 rounded-xl border p-6"
      style={{ borderColor: "#2A2823", color: "#8A8678" }}
    >
      <h2 className="font-mono text-[11px] uppercase tracking-[0.16em]">
        Render notes
      </h2>
      {notes.length === 0 ? (
        <p className="mt-3 text-sm leading-relaxed">
          No issues. Every parameter was used as written.
        </p>
      ) : (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed">
          {notes.map((n, i) => (
            <li key={i} data-note data-code={n.code} data-severity={n.severity}>
              {n.message}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 font-mono text-[11px] leading-relaxed opacity-70">
        canonical: /compose?{canonical}
      </p>
    </section>
  );
}

/** The paste-ready handoff: everything needed to implement this, no re-derivation. */
function Specs({ handoff }: { handoff: ReturnType<typeof buildHandoff> }) {
  return (
    <section id="agent-specs" className="mt-8">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: "#8A8678" }}>
        Implementation
      </h2>

      <div className="mt-4 space-y-6">
        <SpecBlock label="HTML" code={handoff.linkTag} />
        <SpecBlock label="CSS @import" code={handoff.importRule} />
        <SpecBlock label="Tailwind v4 theme" code={handoff.tailwind} />
        <SpecBlock label="CSS custom properties" code={handoff.cssVars} />
        <SpecBlock
          label="Faces"
          code={handoff.cards
            .flatMap((card) =>
              card.fonts.map((f) =>
                [
                  `${f.family} (${f.category})`,
                  `  stack:   ${f.stack}`,
                  f.axes.length
                    ? `  axes:    ${f.axes.join(", ")}`
                    : `  weights: ${f.weights.join(", ") || "400"}`,
                  `  italic:  ${f.italic ? "yes" : "no"}`,
                ].join("\n"),
              ),
            )
            .join("\n\n")}
        />
      </div>
    </section>
  );
}

function SpecBlock({ label, code }: { label: string; code: string }) {
  if (!code) return null;
  return (
    <div>
      <div
        className="font-mono text-[11px] uppercase tracking-[0.16em]"
        style={{ color: "#E8C07A" }}
      >
        {label}
      </div>
      <pre
        className="mt-2 overflow-x-auto rounded-lg border p-4 font-mono text-[12px] leading-relaxed"
        style={{ borderColor: "#2A2823", color: "#F5F3EF" }}
      >
        {code}
      </pre>
    </div>
  );
}
