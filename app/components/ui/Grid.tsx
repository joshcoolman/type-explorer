import { cn } from "@/lib/cn";

/**
 * Container classes for the one card grid. Shared with `GridAlign` so headings can
 * be pinned to the same centered card block. One fluid full-width column until two
 * 22rem cards actually fit, then fixed-width 22rem cards, capped at four columns
 * (`max-w` = 4·22rem + 3·1.5rem gaps) and centered.
 *
 * The column switch is at `min-[49rem]` (≈784px), not `sm` (640px): two cards need
 * 2·22rem + 1rem gap + 2·2rem padding = 49rem. Switching at `sm` left a 640–784px
 * band where `auto-fill` yielded a single 22rem column stranded/centered with wide
 * margins — below that width the full-width single column reads far better.
 */
export const gridShell =
  "mx-auto grid w-full max-w-[92.5rem] justify-center gap-4 lg:gap-6 grid-cols-1 min-[49rem]:[grid-template-columns:repeat(auto-fill,22rem)]";

/**
 * The one card grid — every card surface (Fonts, the pairings showcase, Favorites)
 * uses it so they stay visually in step. Fixed-width cards that stop growing with
 * the viewport (more cards appear instead of wider ones); the block tops out at a
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
