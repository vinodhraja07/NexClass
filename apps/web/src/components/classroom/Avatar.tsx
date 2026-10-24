import clsx from "clsx";
import { motion, useReducedMotion } from "motion/react";
import { MicOff } from "lucide-react";

const SIZES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-xs",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
} as const;

// Apple-inspired refined Emerald Glass avatar palette presets
const AVATAR_PALETTES = [
  { bg: "from-accent-600/35 to-ink-800/80 text-accent-200 border-accent-400/30" },
  { bg: "from-sage-400/25 to-ink-800/80 text-sage-300 border-sage-400/30" },
  { bg: "from-accent-500/35 to-ink-800/80 text-accent-100 border-accent-300/30" },
  { bg: "from-teal-600/30 to-ink-800/80 text-teal-200 border-teal-500/30" },
  { bg: "from-amber-600/25 to-ink-800/80 text-amber-200 border-amber-500/30" },
  { bg: "from-accent-400/30 to-ink-800/80 text-ivory-100 border-accent-400/30" },
];

function getPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

export interface AvatarProps {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
  /** Draws the accent ring used for the active speaker. */
  active?: boolean;
  muted?: boolean;
  showMutedBadge?: boolean;
}

/**
 * Initials placeholder with Apple-inspired visual depth.
 *
 * Shows consistent gradient tints and clean typography instead of flat gray blocks.
 */
export function Avatar({
  name,
  size = "md",
  className,
  active = false,
  muted = false,
  showMutedBadge = false,
}: AvatarProps) {
  const reduced = useReducedMotion();
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "?";

  const palette = getPalette(name);

  return (
    <span className="relative inline-flex shrink-0 items-center justify-center">
      {active && !reduced && (
        <motion.span
          className="absolute -inset-1.5 rounded-full border border-primary/50"
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 0.15, 0.7] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          aria-hidden="true"
        />
      )}
      <span
        aria-hidden="true"
        className={clsx(
          "relative grid place-items-center rounded-full font-display font-semibold tracking-wide select-none shadow-sm transition-all duration-300",
          "bg-gradient-to-b border",
          palette.bg,
          SIZES[size],
          active
            ? "border-primary ring-2 ring-primary/40 shadow-md shadow-primary/25"
            : "border-border/60 hover:border-border",
          muted && "opacity-90",
          className,
        )}
      >
        <span className="drop-shadow-sm">{initials}</span>
      </span>

      {showMutedBadge && muted && size !== "xs" && (
        <span
          className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-signal-live text-white shadow-sm ring-1 ring-background"
          title="Microphone muted"
        >
          <MicOff className="h-2.5 w-2.5" aria-hidden="true" />
        </span>
      )}
    </span>
  );
}
