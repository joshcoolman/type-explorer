/**
 * UI type roles — the *chrome* typography (nav, headings, controls, annotations),
 * rendered in Geist sans / mono. These are deliberately small and role-based,
 * adapted from the Material 3 type-scale model (categories x sizes).
 *
 * NOTE: this is for app chrome only. The *specimen* typography — the Google Fonts
 * being showcased — is content and stays dynamic; do not route it through here.
 *
 * Color is intentionally absent: callers supply color via token classes
 * (text-text, text-muted, text-accent) or inline style.
 */
export const typeRole = {
  /** Hero headings — page titles. */
  display: "text-4xl font-semibold leading-[1.05] sm:text-5xl",
  /** Section / card / panel headers. */
  title: "text-xl font-semibold leading-snug",
  /** Running UI copy. */
  body: "text-sm leading-relaxed",
  /** The recurring mono uppercase annotation (eyebrows, footers, field labels). */
  label: "font-mono text-[11px] uppercase tracking-[0.16em]",
} as const;

export type TypeRole = keyof typeof typeRole;
