"use client";

import { usePathname } from "next/navigation";
import GlobalNav from "./GlobalNav";
import Footer from "./Footer";

/**
 * The site's own nav and footer — everywhere except a composed page.
 *
 * `/compose` is not a page *of* the site; it is a page the site produced on behalf
 * of someone else. Site navigation there is noise at best and misleading at worst
 * (the recipient didn't come here to browse fonts), and both strips read the
 * `--page-*` variables a viewer can customize, which would leak local preference
 * into a link meant to look the same for everyone.
 *
 * Done as a pathname check rather than route groups deliberately: the alternative
 * is relocating every existing route under a `(site)` group to escape the root
 * layout, which is a large mechanical change across ~1,900 generated pages for a
 * result this achieves in a few lines.
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const bare = usePathname()?.startsWith("/compose") ?? false;

  return (
    <>
      {!bare && <GlobalNav />}
      {children}
      {!bare && <Footer />}
    </>
  );
}
