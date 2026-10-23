import { motion } from "motion/react";
import clsx from "clsx";

export interface ToggleProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

/** A labelled switch. Implemented as a button with role="switch". */
export function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: ToggleProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between gap-4 rounded-xl border border-ink-700 bg-ink-900/40 px-3.5 py-3 transition-colors",
        disabled && "opacity-50",
      )}
    >
      <div className="min-w-0">
        <p id={`${id}-label`} className="text-[13px] font-medium text-ivory-100">
          {label}
        </p>
        {description ? (
          <p className="mt-0.5 text-2xs leading-relaxed text-ivory-400">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          "nc-focus relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200",
          checked ? "border-accent-400/60 bg-accent-400/25" : "border-ink-500 bg-ink-700",
          disabled && "pointer-events-none",
        )}
      >
        <motion.span
          className={clsx(
            "absolute top-0.5 h-[18px] w-[18px] rounded-full",
            checked ? "bg-accent-400" : "bg-ivory-400",
          )}
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 520, damping: 34 }}
        />
      </button>
    </div>
  );
}
