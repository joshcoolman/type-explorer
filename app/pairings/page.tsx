import SuggestedPairings from "../components/SuggestedPairings";
import type { Pairing } from "../../lib/types";
import data from "../../content/suggested-pairings.json";

/**
 * Pairings to drop from the showcase entirely. Two kinds:
 *  1. Near-identical sibling pairs — two members of the same superfamily that read
 *     as nearly the same face (small-caps / width / optical / version variants).
 *     Genre-contrasting superfamily pairs (serif × sans × mono, e.g. "DM Sans & DM
 *     Mono") are intentionally kept — they look distinct.
 *  2. Hand-culled pairings that aren't common enough to surface as "popular" and
 *     weren't wanted up top either.
 */
const HIDDEN_PAIRING_IDS = new Set([
  // 1. Near-identical siblings.
  "special-gothic-condensed-one-special-gothic",
  "special-gothic-expanded-one-special-gothic",
  "ysabeau-infant-ysabeau",
  "ysabeau-sc-ysabeau",
  "zen-kaku-gothic-antique-zen-kaku-gothic-new",
  "zalando-sans-expanded-zalando-sans",
  "palanquin-dark-palanquin",
  "alegreya-sc-alegreya",
  "alegreya-sans-sc-alegreya-sans",
  "ubuntu-condensed-ubuntu-sans",
  "ubuntu-sans-ubuntu",
  "ubuntu-sans-mono-ubuntu-mono",
  "ubuntu-condensed-ubuntu",
  "pt-sans-caption-pt-sans",
  "pt-sans-narrow-pt-sans",
  "playfair-display-sc-playfair",
  "playfair-display-playfair",
  "encode-sans-expanded-encode-sans-condensed",
  "barlow-semi-condensed-barlow",
  "ibm-plex-sans-condensed-ibm-plex-sans",
  // 2. Culled but not popular enough for the Popular section.
  "yellowtail-lato",
  "yellowtail-nunito",
  "lustria-mulish",
  "noto-serif-display-noto-sans",
  "zain-nunito",
  "voltaire-inter",
  "brawler-nunito-sans",
  "ubuntu-sans-mono-ubuntu-sans",
]);

/**
 * Commonly-popular pairings — both faces rank inside the ~200 most popular. Kept
 * out of the top "Suggested" list (which favors less-common picks) and re-exposed
 * in a grouped "Popular" section below.
 */
const POPULAR_PAIRING_IDS = new Set([
  "montserrat-google-sans",
  "montserrat-nunito",
  "rubik-karla",
  "source-sans-pro-source-code-pro",
  "libre-franklin-libre-baskerville",
  "work-sans-bitter",
  "montserrat-hind",
  "bricolage-grotesque-geist",
  "archivo-ibm-plex-mono",
  "instrument-sans-instrument-serif",
  "geist-mono-eb-garamond",
  "epilogue-inter",
  "roboto-roboto-serif",
]);

export default function PairingsShowcase() {
  // Drop same-family weight "pairings" and the hidden set; then split the rest into
  // less-common picks (Suggested) and the popular re-exposed group (Popular).
  const visible = (data.pairings as Pairing[]).filter(
    (p) => !p.monovoice && p.heading !== p.body && !HIDDEN_PAIRING_IDS.has(p.id),
  );
  const suggested = visible.filter((p) => !POPULAR_PAIRING_IDS.has(p.id));
  const popular = visible.filter((p) => POPULAR_PAIRING_IDS.has(p.id));

  return <SuggestedPairings pairings={suggested} popular={popular} />;
}
