import { cn } from "@/lib/cn";

const GAP = {
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  6: "gap-6",
  8: "gap-8",
} as const;

/**
 * Vertical rhythm wrapper — a flex column with a gap drawn from the approved
 * spacing scale. Keeps spacing between stacked blocks consistent instead of
 * scattering space-y-* / mt-* by hand. Structure only.
 */
export default function Stack({
  gap = 4,
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { gap?: keyof typeof GAP }) {
  return (
    <div className={cn("flex flex-col", GAP[gap], className)} {...rest}>
      {children}
    </div>
  );
}
