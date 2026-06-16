import { cn } from "@/lib/cn";
import { typeRole } from "./typeRoles";

/**
 * The recurring mono uppercase annotation role (eyebrows, footers, field labels).
 * Unifies the drifting `text-[11px] tracking-[0.1*em]` variants into one token.
 * Color is the caller's (text-muted / text-accent / inline style).
 */
export default function Label({
  as: Tag = "span",
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLElement> & {
  as?: "span" | "div" | "h1" | "h2" | "h3" | "p";
}) {
  return (
    <Tag className={cn(typeRole.label, className)} {...rest}>
      {children}
    </Tag>
  );
}
