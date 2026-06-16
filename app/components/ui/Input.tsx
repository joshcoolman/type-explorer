import { cn } from "@/lib/cn";

/**
 * Shared field structure (radius, padding rhythm, size, transition). Color is the
 * caller's: pass token classes (`border-border bg-panel text-text
 * placeholder:text-muted focus:border-accent`) or inline `style`. The bare
 * `border` sets width only — supply a border color or it inherits currentColor.
 */
export const fieldBase =
  "rounded-control border px-3 py-2 text-sm outline-none transition-colors";

export function Input({
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...rest} />;
}

export function Textarea({
  className,
  ...rest
}: React.ComponentPropsWithRef<"textarea">) {
  return <textarea className={cn(fieldBase, "resize-y", className)} {...rest} />;
}
