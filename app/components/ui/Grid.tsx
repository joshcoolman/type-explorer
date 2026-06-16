import { cn } from "@/lib/cn";

/**
 * The one card grid. Replaces the three divergent grid declarations that drifted
 * across views. Responsive column ramp 1 -> 2 -> 3 -> 4 with the standard gap
 * rhythm (gap-4, widening to gap-6 at lg). Structure only.
 *
 * `dense` starts at 2 columns on the smallest screens (used by the Home gallery,
 * which never went single-column).
 */
export default function Grid({
  dense = false,
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { dense?: boolean }) {
  return (
    <div
      className={cn(
        "grid gap-4 lg:gap-6",
        dense ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2",
        "lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
