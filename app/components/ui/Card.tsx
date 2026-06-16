import { cn } from "@/lib/cn";

const PAD = { none: "", sm: "p-3", md: "p-4", lg: "p-6" } as const;

/**
 * Structural card shell — radius + border width + padding rhythm. Carries no
 * color, so the per-card light/dark specimen themes flow straight through via
 * `style` / `className` (background, text, border color). Use for tiles and
 * small cards. Larger feature surfaces use `radius="surface"`.
 */
export default function Card({
  as: Tag = "div",
  pad = "md",
  radius = "card",
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article" | "li";
  pad?: keyof typeof PAD;
  radius?: "card" | "surface";
}) {
  return (
    <Tag
      className={cn(
        "border",
        radius === "surface" ? "rounded-surface" : "rounded-card",
        PAD[pad],
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
