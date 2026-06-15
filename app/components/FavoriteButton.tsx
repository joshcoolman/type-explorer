/**
 * A heart toggle for collecting a card. Outline when unset, filled when
 * favorited. Colors are passed in so it can sit on any card field (light or
 * dark) and stay legible.
 */
export default function FavoriteButton({
  active,
  onToggle,
  color,
  activeColor,
  label = "font",
}: {
  active: boolean;
  onToggle: () => void;
  color: string; // outline / resting color
  activeColor: string; // fill when favorited
  label?: string; // for the aria label, e.g. "font" or "pairing"
}) {
  return (
    <button
      type="button"
      aria-label={active ? `Remove ${label} from favorites` : `Add ${label} to favorites`}
      aria-pressed={active}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-110"
      style={{ color: active ? activeColor : color }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
