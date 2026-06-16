import { cn } from "@/lib/cn";

/**
 * Container classes for the one card grid. Shared with `GridAlign` so headings can
 * be pinned to the same centered card block. One fluid full-width column on the
 * smallest screens, then fixed-width 22rem cards, capped at four columns (`max-w`
 * = 4·22rem + 3·1.5rem gaps) and centered.
 */
export const gridShell =
  "mx-auto grid w-full max-w-[92.5rem] justify-center gap-4 lg:gap-6 grid-cols-1 sm:[grid-template-columns:repeat(auto-fill,22rem)]";

/**
 * The one card grid — every card surface (Explorer, Home, pairings overlay) uses
 * it so they stay visually in step. Fixed-width cards that stop growing with the
 * viewport (more cards appear instead of wider ones); the block tops out at a
 * four-across row, centered with even space on the left and right, and centers
 * however many columns fit below that.
 */
export default function Grid({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(gridShell, className)} {...rest}>
      {children}
    </div>
  );
}
