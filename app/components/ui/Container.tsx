import { cn } from "@/lib/cn";

/**
 * Page-width container: centers content at the app max-width with responsive
 * side margins (the M3 "expanded/large" window-class margin step).
 * Structure only — no color, no vertical padding (compose with Stack/section).
 */
export default function Container({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1400px] px-5 sm:px-8", className)}
      {...rest}
    >
      {children}
    </div>
  );
}
