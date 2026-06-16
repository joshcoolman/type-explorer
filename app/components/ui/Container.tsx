import { cn } from "@/lib/cn";

/**
 * Page-width container: centers content with responsive side margins (the M3
 * "expanded/large" window-class margin step). The max-width is sized so a
 * four-across card row (the `Grid` cap of 92.5rem) fits inside the side padding
 * — 92.5rem + 2·2rem (sm:px-8) = 96.5rem — keeping headers and cards on the same
 * centered measure. Structure only — no color, no vertical padding.
 */
export default function Container({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[96.5rem] px-5 sm:px-8", className)}
      {...rest}
    >
      {children}
    </div>
  );
}
