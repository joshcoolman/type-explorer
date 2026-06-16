import { cn } from "@/lib/cn";

/**
 * The one card grid — every card surface (Explorer, Home, pairings overlay) uses
 * it so they stay visually in step. Standard gap rhythm (gap-4, widening to gap-6
 * at lg).
 *
 * One fluid full-width column on the smallest screens, then fixed-width cards
 * (22rem) packed with auto-fill. Above a single column the cards stop growing
 * with the viewport — more cards appear instead of wider ones. The block is
 * left-aligned (not centered) so its left edge lines up with the page header
 * above it; surplus space collects on the right.
 */
export default function Grid({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "grid gap-4 lg:gap-6",
        "grid-cols-1 sm:[grid-template-columns:repeat(auto-fill,22rem)]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
