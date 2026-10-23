import type { ReactNode } from "react";
import { AlertTriangle, Info } from "lucide-react";
import clsx from "clsx";

export interface ErrorNoticeProps {
  title: string;
  message: ReactNode;
  tone?: "error" | "warn" | "info";
  action?: ReactNode;
  className?: string;
}

const TONES = {
  error: {
    wrapper: "border-signal-live/35 bg-signal-live/8",
    icon: "text-signal-live",
    title: "text-signal-live",
  },
  warn: {
    wrapper: "border-signal-warn/35 bg-signal-warn/8",
    icon: "text-signal-warn",
    title: "text-signal-warn",
  },
  info: {
    wrapper: "border-signal-info/35 bg-signal-info/8",
    icon: "text-signal-info",
    title: "text-signal-info",
  },
} as const;

/** A prominent, announced message block used for page level state. */
export function ErrorNotice({
  title,
  message,
  tone = "error",
  action,
  className,
}: ErrorNoticeProps) {
  const palette = TONES[tone];
  return (
    <div
      role="alert"
      className={clsx(
        "flex flex-col gap-3 rounded-xl border px-4 py-3.5 sm:flex-row sm:items-start",
        palette.wrapper,
        className,
      )}
    >
      <span className={clsx("mt-0.5 shrink-0", palette.icon)}>
        {tone === "info" ? (
          <Info className="h-4 w-4" aria-hidden="true" />
        ) : (
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className={clsx("text-[13px] font-semibold", palette.title)}>{title}</p>
        <div className="mt-1 text-2xs leading-relaxed text-ivory-300">{message}</div>
      </div>
      {action ? <div className="shrink-0 sm:ml-2">{action}</div> : null}
    </div>
  );
}
