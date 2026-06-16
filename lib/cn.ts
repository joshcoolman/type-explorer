/**
 * Minimal className joiner. Filters falsy values and joins with spaces.
 *
 * No conflict-resolution (unlike tailwind-merge): later strings do NOT reliably
 * override earlier Tailwind utilities, since Tailwind orders rules by its own
 * layer, not by source order. Keep primitive base classes free of properties a
 * caller is expected to override (use size/variant props for those instead), and
 * use `cn` only to append non-conflicting classes (color, layout, one-offs).
 */
export type ClassValue = string | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
