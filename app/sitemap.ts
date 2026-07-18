import type { MetadataRoute } from "next";
import libraryJson from "@/content/pairing-library.json";
import type { PairingLibrary } from "@/lib/pairing-library";
import { slugify } from "@/lib/slug";

/**
 * `/compose` is deliberately absent: it is an unbounded parameterized route, so
 * listing it would be listing infinite crawl space. It stays reachable (and
 * fetchable by an agent verifying its own URL) and simply isn't advertised.
 */

const library = libraryJson as PairingLibrary;
const BASE = "https://googlefontfinder.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/pairings", "/favorites", "/colors", "/changelog", "/backlog"];

  return [
    ...staticRoutes.map((path) => ({
      url: `${BASE}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
    ...Object.keys(library).map((family) => ({
      url: `${BASE}/pairings/${slugify(family)}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
