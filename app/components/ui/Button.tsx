import { cn } from "@/lib/cn";

const SIZES = {
  /** chips, filter/sort pills */
  sm: "px-2.5 py-1 text-xs",
  /** standard actions (load more, submit) */
  md: "px-4 py-2 text-sm",
  /** square icon button, compact */
  "icon-sm": "h-8 w-8",
  /** square icon button */
  icon: "h-10 w-10",
} as const;

/**
 * Structural button: radius, padding rhythm, weight, focus ring, transition.
 * Carries NO color — pass color via className (token classes like
 * `bg-accent text-bg`) or inline `style` (for the per-surface inline palettes).
 * The focus ring uses `ring-current`, so it adapts to whatever text color the
 * caller sets.
 */
export default function Button({
  size = "md",
  shape = "control",
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: keyof typeof SIZES;
  /** "control" = standard radius; "pill" = fully rounded (circular icon buttons). */
  shape?: "control" | "pill";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors outline-none",
        shape === "pill" ? "rounded-full" : "rounded-control",
        "focus-visible:ring-2 focus-visible:ring-current/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
