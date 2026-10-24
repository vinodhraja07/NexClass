import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import clsx from "clsx";
import { SPRINGS } from "@/lib/motion";

/* ------------------------------- Button -------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "quiet" | "emerald";
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
    "relative overflow-hidden bg-gradient-to-r from-accent-400 via-accent-300 to-accent-300/90 text-ink-950 font-semibold tracking-tight border border-accent-200/35 shadow-[0_4px_16px_-4px_rgba(50,185,138,0.35),0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.25)] hover:shadow-[0_6px_24px_-2px_rgba(50,185,138,0.5),0_2px_4px_rgba(0,0,0,0.4)] hover:brightness-105 active:brightness-95",
  emerald:
    "relative overflow-hidden bg-gradient-to-r from-accent-400 to-accent-300 text-ink-950 font-semibold tracking-tight border border-accent-200/30 shadow-[0_4px_16px_-4px_rgba(120,169,139,0.4),inset_0_1px_0_0_rgba(255,255,255,0.2)] hover:shadow-[0_6px_24px_-2px_rgba(50,185,138,0.5)] transition-all",
  secondary:
    "relative overflow-hidden bg-ink-800/85 hover:bg-ink-750 text-ivory-100 border border-ink-600/75 hover:border-accent-400/50 shadow-[0_4px_12px_rgba(0,0,0,0.25),inset_0_1px_0_0_rgba(255,255,255,0.04)] hover:shadow-[0_0_20px_rgba(120,169,139,0.18)] backdrop-blur-md font-medium",
  ghost:
    "text-ivory-300 hover:text-ivory-100 hover:bg-ink-800/60 border border-transparent hover:border-ink-600/60 hover:shadow-xs font-medium",
  danger:
    "relative overflow-hidden bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 text-white font-semibold border border-rose-400/40 shadow-[0_4px_20px_-4px_rgba(255,92,108,0.35)] hover:shadow-[0_6px_28px_-2px_rgba(255,92,108,0.5)] hover:brightness-105 active:brightness-95",
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
  const reduced = useReducedMotion() ?? false;

  return (
    <motion.button
      ref={ref}
      whileHover={disabled || loading || reduced ? undefined : { scale: 1.018, y: -1 }}
      whileTap={disabled || loading || reduced ? undefined : { scale: 0.98, y: 0 }}
      transition={SPRINGS.micro}
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
          {required ? <span className="ml-1 text-accent-300">*</span> : null}
        </span>
        {hint ? <span className="text-2xs text-ivory-400">{hint}</span> : null}
      </span>
      {children}
      {error ? (
        <span role="alert" className="block text-2xs font-medium text-signal-rec">
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
        "nc-focus h-11 w-full rounded-xl border bg-ink-850/80 px-3.5 text-sm text-ivory-100",
        "placeholder:text-ivory-400/60 transition-[border-color,background-color,box-shadow] duration-150 backdrop-blur-md shadow-xs",
        invalid
          ? "border-signal-rec/70 focus:border-signal-rec"
          : "border-ink-600/80 hover:border-ink-500/90 focus:border-accent-400 focus:bg-ink-800/90",
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
        "nc-focus h-11 w-full appearance-none rounded-xl border bg-ink-850/80 px-3.5 text-sm text-ivory-100",
        "transition-[border-color,background-color] duration-150 backdrop-blur-md shadow-xs",
        invalid
          ? "border-signal-rec/70 focus:border-signal-rec"
          : "border-ink-600/80 hover:border-ink-500/90 focus:border-accent-400 focus:bg-ink-800/90",
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
  tone?: "neutral" | "accent" | "live" | "warn" | "info" | "sage";
  className?: string;
}) {
  const tones = {
    neutral: "bg-ink-800/80 text-ivory-300 border-ink-600/60",
    accent: "bg-accent-400/15 text-accent-300 border-accent-400/35",
    sage: "bg-sage-400/15 text-sage-400 border-sage-400/30",
    live: "bg-accent-300/15 text-accent-300 border-accent-300/35",
    warn: "bg-signal-warn/15 text-signal-warn border-signal-warn/35",
    info: "bg-accent-400/15 text-accent-300 border-accent-400/35",
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
    <Tag className={clsx("nc-glass-card shadow-panel", className)}>{children}</Tag>
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
      <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-accent-300 opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-300 shadow-[0_0_8px_#32B98A]" />
    </span>
  );
}
