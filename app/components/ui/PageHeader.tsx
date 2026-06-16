import { cn } from "@/lib/cn";
import { typeRole } from "./typeRoles";

/**
 * The one page header. Every view renders this so the title treatment and
 * position never shift between pages — only the text changes. The display title
 * sits on the left; an optional `actions` slot (e.g. the Explorer search +
 * filters) sits on the right, opposite the title, at lg+ — stacking into a
 * full-width row beneath on narrow screens.
 *
 * The title inherits the page foreground (each page's `<main>` sets the color),
 * matching the rest of the page chrome.
 */
export default function PageHeader({
  title,
  actions,
  className,
}: {
  title: React.ReactNode;
  /** Right-side content (search, filters). Stacks below the title on narrow screens. */
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-10", className)}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <h1 className={`min-w-0 ${typeRole.display}`}>{title}</h1>
        {actions && <div className="w-full shrink-0 lg:w-auto">{actions}</div>}
      </div>
    </header>
  );
}
