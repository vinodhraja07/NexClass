import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { motion } from "motion/react";
import clsx from "clsx";

/* ------------------------------- Button -------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "quiet";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  trailing?: ReactNode;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "relative overflow-hidden bg-gradient-to-r from-accent-400 via-sky-500 to-rose-400 text-white font-semibold tracking-tight border border-sky-300/30 shadow-[0_4px_20px_-4px_rgba(2,132,199,0.5),0_1px_2px_rgba(0,0,0,0.4)] hover:shadow-[0_6px_28px_-2px_rgba(255,42,122,0.6),0_2px_4px_rgba(0,0,0,0.5)] hover:brightness-105 active:brightness-95",
  secondary:
    "relative overflow-hidden bg-gradient-to-b from-ink-800/90 to-ink-900/95 text-ivory-50 border border-ink-600/80 hover:border-accent-400/50 hover:bg-ink-750 hover:text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(2,132,199,0.25)] backdrop-blur-md font-medium",
  ghost:
    "text-ivory-300 hover:text-ivory-50 hover:bg-ink-800/70 border border-transparent hover:border-ink-600/70 hover:shadow-sm font-medium",
  danger:
    "relative overflow-hidden bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 text-white font-semibold border border-rose-400/40 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.45)] hover:shadow-[0_6px_28px_-2px_rgba(244,63,94,0.65)] hover:brightness-110 active:brightness-95",
  quiet: "bg-transparent text-ivory-400 hover:text-ivory-100 hover:bg-ink-800/40 transition-colors duration-150",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5 rounded-lg",
  md: "h-11 px-5 text-sm gap-2 rounded-xl",
  lg: "h-13 px-7 text-[15px] gap-2.5 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, icon, trailing, className, children, disabled, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileHover={disabled || loading ? undefined : { scale: 1.02, y: -1 }}
      whileTap={disabled || loading ? undefined : { scale: 0.97, y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      className={clsx(
        "nc-focus group inline-flex items-center justify-center font-medium transition-[background,border,box-shadow,color,transform] duration-200 cursor-pointer select-none",
        "disabled:opacity-45 disabled:pointer-events-none disabled:cursor-not-allowed",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...(rest as Record<string, unknown>)}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent shrink-0" />
      ) : (
        icon && <span className="shrink-0 transition-transform duration-150 group-hover:scale-105">{icon}</span>
      )}
      {children}
      {trailing && <span className="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5">{trailing}</span>}
    </motion.button>
  );
});

/* -------------------------------- Input -------------------------------- */

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  htmlFor?: string;
}

export function Field({ label, hint, error, required, children, htmlFor }: FieldProps) {
  return (
    <label className="block space-y-1.5" htmlFor={htmlFor}>
      <span className="flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-ivory-200">
          {label}
          {required ? <span className="ml-1 text-accent-400">*</span> : null}
        </span>
        {hint ? <span className="text-2xs text-ivory-400">{hint}</span> : null}
      </span>
      {children}
      {error ? (
        <span role="alert" className="block text-2xs font-medium text-signal-live">
          {error}
        </span>
      ) : null}
    </label>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={clsx(
        "nc-focus h-11 w-full rounded-xl border bg-ink-900/70 px-3.5 text-sm text-ivory-50",
        "placeholder:text-ivory-400/60 transition-colors",
        invalid ? "border-signal-live/70" : "border-ink-600 hover:border-ink-500",
        className,
      )}
      {...rest}
    />
  );
});

export const Select = forwardRef<HTMLSelectElement, InputProps>(function Select(
  { className, invalid, children, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={clsx(
        "nc-focus h-11 w-full appearance-none rounded-xl border bg-ink-900/70 px-3.5 text-sm text-ivory-50",
        invalid ? "border-signal-live/70" : "border-ink-600 hover:border-ink-500",
        className,
      )}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </select>
  );
});

/* -------------------------------- Badge -------------------------------- */

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "live" | "warn" | "info";
  className?: string;
}) {
  const tones = {
    neutral: "bg-ink-700/80 text-ivory-300 border-ink-500/60",
    accent: "bg-accent-400/12 text-accent-300 border-accent-400/30",
    live: "bg-signal-live/12 text-signal-live border-signal-live/30",
    warn: "bg-signal-warn/12 text-signal-warn border-signal-warn/30",
    info: "bg-signal-info/12 text-signal-info border-signal-info/30",
  } as const;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-semibold tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------- Card --------------------------------- */

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return (
    <Tag className={clsx("nc-surface shadow-panel", className)}>{children}</Tag>
  );
}

/* ------------------------------- Spinner ------------------------------- */

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={clsx(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}

/* ------------------------------ Live dot ------------------------------- */

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={clsx("relative flex h-2 w-2", className)}>
      <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-signal-live" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-signal-live" />
    </span>
  );
}
