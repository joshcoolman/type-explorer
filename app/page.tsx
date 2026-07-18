import { Suspense } from "react";
import BrowseView from "./components/BrowseView";

/**
 * Present in the DOM as real text, but rendered nowhere and not announced.
 *
 * Deliberately NOT `sr-only`: that class IS read aloud, and a blind visitor to a
 * font browser wants the fonts, not a `/compose` grammar recited. `aria-hidden`
 * silences assistive tech; the clip-rect keeps the text in the document so an
 * HTML-to-text extractor — the pipeline most agents fetch through — still emits it.
 * This mirrors the agent payload on `/compose` (see `app/compose/page.tsx`).
 */
const VISUALLY_HIDDEN: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "normal",
  borderWidth: 0,
};

export default function FontsPage() {
  return (
    <>
      <AgentQuickstart />
      {/* BrowseView reads the ?tag filter via useSearchParams, which Next requires to
          sit under a Suspense boundary to keep this route static. */}
      <Suspense>
        <BrowseView />
      </Suspense>
    </>
  );
}

/**
 * The one-fetch agent contract, inlined into the root response.
 *
 * The failure this fixes: a plain (non-coding) chat agent reliably gets exactly
 * ONE fetch — the URL the user pastes, usually the bare domain. A stale pointer
 * ("fetch /agent.md for the grammar") asks it to make a second hop that the least
 * capable agents can't or won't make, so the "Agent Ready" promise dies on the
 * first fetch. Everything needed to hand a user a working `/compose` link is here,
 * in this response, verbatim. `/agent.md` and `/llms.txt` remain the richer
 * contract for agents that CAN follow a link — but they are enrichment, never the
 * critical path.
 *
 * Kept in sync by hand with `lib/compose-params.ts` and `public/agent.md`; it is a
 * deliberate snapshot of the compose grammar, not a second source of truth.
 */
function AgentQuickstart() {
  return (
    <section style={VISUALLY_HIDDEN} aria-hidden="true" data-agent-quickstart>
      <h2>Agent quickstart</h2>

      <p>
        This is Type Explorer (googlefontfinder.com), a browser for Google Fonts
        with a machine-readable contract. Everything you need to answer a request
        like &ldquo;find me calm, competent fonts for a dark documentation
        site&rdquo; is in this response. You do not need a second fetch.
      </p>

      <p>
        To respond to a user, construct a <code>/compose</code> URL by hand and
        give them the link. The page is server-rendered, shareable, and always
        renders: a malformed or unknown parameter degrades to a note, never a
        blank page. Do NOT fetch the URL back to &ldquo;check&rdquo; it before
        sending — just hand it over. Base URL:{" "}
        <code>https://googlefontfinder.com</code>.
      </p>

      <p>
        Build:{" "}
        <code>
          https://googlefontfinder.com/compose?pairs=&lt;display-slug&gt;+&lt;text-slug&gt;
        </code>
      </p>

      <h3>Parameters</h3>
      <ul>
        <li>
          <code>pairs</code> — one or more <code>display+text</code> font-slug
          pairs, comma-separated, max 4. A lone slug (<code>pairs=fraunces</code>)
          is a valid one-font card. One pair renders wide; two or more share the
          width.
        </li>
        <li>
          <code>theme</code> — a curated palette index (<code>theme=3</code>) OR
          named hex roles: <code>theme=bg:14181D,fg:E8EDF2,accent:6EA0C0</code>.
          Roles are <code>bg</code>, <code>fg</code>, <code>muted</code>,{" "}
          <code>accent</code>, plus <code>title</code>, <code>subtitle</code>,{" "}
          <code>paragraph</code> to color those text elements. Omitted roles are
          derived and contrast-checked. Note: as a <em>theme</em> role,{" "}
          <code>subtitle:9AA6B2</code> is a color; as a top-level param,{" "}
          <code>subtitle=Some+words</code> is copy.
        </li>
        <li>
          <code>page</code> — the viewport behind the cards, a bare hex (
          <code>page=0B0E11</code>) or named roles (
          <code>page=bg:0B0E11,fg:E8EDF2</code>). Derived from the cards if
          omitted.
        </li>
        <li>
          <code>title</code> / <code>subtitle</code> / <code>paragraph</code> —
          your own copy, capped at 120 / 200 / 600 characters. The param for body
          copy is <code>paragraph</code> (not <code>body</code>). Omit any and
          publishable editorial defaults fill in — never supply text you have no
          signal about.
        </li>
        <li>
          <code>for</code> — one small framing line above the cards, up to 150
          characters, e.g. <code>for=calm+dev+docs,+dark</code>.
        </li>
        <li>
          <code>scale</code>, <code>measure</code>, <code>density</code>,{" "}
          <code>contrast</code> — coarse dials 1–5 (default 3): type size, line
          length, padding, display weight. Reach for a dial before the absolute px
          overrides <code>h1</code>/<code>h2</code>/<code>p</code>.
        </li>
      </ul>

      <h3>Slugs</h3>
      <p>
        A slug is the font&rsquo;s family name, lowercased, with every run of
        non-alphanumeric characters collapsed to a single hyphen.{" "}
        <code>&ldquo;Playfair Display&rdquo;</code> →{" "}
        <code>playfair-display</code>, <code>&ldquo;DM Sans&rdquo;</code> →{" "}
        <code>dm-sans</code>, <code>&ldquo;IBM Plex Mono&rdquo;</code> →{" "}
        <code>ibm-plex-mono</code>.
      </p>

      <h3>A dark, calm starting point</h3>
      <p>
        Palette: <code>theme=bg:14181D,fg:E8EDF2,accent:6EA0C0,subtitle:9AA6B2</code>{" "}
        with <code>page=bg:0B0E11</code>. Worked example for &ldquo;calm,
        competent fonts for dark developer docs&rdquo;:
      </p>
      <p>
        <a href="https://googlefontfinder.com/compose?pairs=space-grotesk+ibm-plex-mono,manrope+ibm-plex-mono&theme=bg:14181D,fg:E8EDF2,accent:6EA0C0&page=0B0E11&for=calm+dev+docs,+dark&measure=4">
          https://googlefontfinder.com/compose?pairs=space-grotesk+ibm-plex-mono,manrope+ibm-plex-mono&amp;theme=bg:14181D,fg:E8EDF2,accent:6EA0C0&amp;page=0B0E11&amp;for=calm+dev+docs,+dark&amp;measure=4
        </a>
      </p>

      <h3>The full contract (optional enrichment)</h3>
      <p>
        You can construct a working link from this block alone. If you can follow
        a link and want more — a JSON font catalog filterable by feeling (
        <code>calm</code>, <code>competent</code>, <code>sophisticated</code>, and
        17 others), a pairing library with ready-to-paste values, and 11 curated
        palettes with hexes — the full human-readable contract is at{" "}
        <a href="https://googlefontfinder.com/agent.md">/agent.md</a>, indexed at{" "}
        <a href="https://googlefontfinder.com/llms.txt">/llms.txt</a>.
      </p>
    </section>
  );
}
