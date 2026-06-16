import { cn } from "@/lib/cn";
import { gridShell } from "./Grid";

/**
 * Pins its content to the centered card-grid block. It lays out an invisible grid
 * with the exact same column math as `Grid`, then spans its single child across
 * all columns (`grid-column: 1 / -1`). Because the columns center the same way as
 * the cards, the child's left and right edges track the leftmost/rightmost card
 * at every breakpoint — so a page header lines up with the cards beneath it
 * whether the grid is showing two, three, or four columns.
 *
 * Pass margin (e.g. `mb-10`) via `className` to space it from the grid below.
 */
export default function GridAlign({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(gridShell, className)} {...rest}>
      <div className="col-[1/-1] min-w-0">{children}</div>
    </div>
  );
}
