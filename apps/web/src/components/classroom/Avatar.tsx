import clsx from "clsx";

const SIZES = {
  xs: "h-6 w-6 text-[9px]",
  sm: "h-8 w-8 text-2xs",
  md: "h-10 w-10 text-xs",
  lg: "h-14 w-14 text-sm",
  xl: "h-20 w-20 text-lg",
} as const;

export interface AvatarProps {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
  /** Draws the accent ring used for the active speaker. */
  active?: boolean;
  muted?: boolean;
}

/**
 * Initials placeholder.
 *
 * Used whenever a participant has no live video yet - a dark rectangle would
 * read as a broken call, an avatar reads as "camera off".
 */
export function Avatar({ name, size = "md", className, active = false, muted = false }: AvatarProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <span
      aria-hidden="true"
      className={clsx(
        "grid shrink-0 place-items-center rounded-full font-display font-semibold tracking-wide",
        "bg-ink-700 text-ivory-100 ring-1 ring-inset ring-ink-500",
        SIZES[size],
        active && "ring-2 ring-accent-400",
        muted && "opacity-80",
        className,
      )}
    >
      {initials || "?"}
    </span>
  );
}
