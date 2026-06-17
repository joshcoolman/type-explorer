import Link from "next/link";
import { notFound } from "next/navigation";
import libraryJson from "@/content/pairing-library.json";
import type { PairingLibrary } from "@/lib/pairing-library";
import { slugify, familyForSlug } from "@/lib/slug";
import { PAGE_THEME } from "@/lib/card-themes";
import PairingsView from "@/app/components/PairingsView";
import { Container, GridAlign, PageHeader } from "@/app/components/ui";

const library = libraryJson as PairingLibrary;

/** Pre-render a page for every font that has pairings. */
export function generateStaticParams() {
  return Object.keys(library).map((family) => ({ slug: slugify(family) }));
}

export default async function PairingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const source = familyForSlug(slug, Object.keys(library));
  if (!source) notFound();

  const entry = library[source];

  return (
    <main
      className="flex-1"
      style={{ background: PAGE_THEME.bg, color: PAGE_THEME.fg }}
    >
      <Container className="pt-6 pb-12 sm:pt-8 sm:pb-16">
        <GridAlign className="mb-10">
          <div className="flex flex-col gap-4 sm:relative sm:block sm:gap-0">
            {/* Circular caret — mirrors the nav gear (h-8 w-8 pill). On sm+ it
                floats into the left gutter, vertically centered on the title and
                outside the card-grid margin (right-full sits it just left of the
                wrapper, whose edge tracks the cards). Mobile has no gutter, so it
                stacks above the title instead of clipping off-screen. */}
            <Link
              href="/"
              aria-label="Back to fonts"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center self-start rounded-full border transition-colors hover:opacity-70 sm:absolute sm:right-full sm:top-1/2 sm:mr-4 sm:-translate-y-1/2"
              style={{ borderColor: "#2A2823", color: PAGE_THEME.muted }}
            >
              <ChevronLeftIcon />
            </Link>

            <PageHeader title={`Pairings for ${source}`} className="mb-0" />
          </div>
        </GridAlign>

        <PairingsView source={source} entry={entry} />
      </Container>
    </main>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
