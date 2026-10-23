import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Copy, Gauge, SignalHigh, SignalLow, SignalMedium, TriangleAlert } from "lucide-react";
import clsx from "clsx";
import type { ConnectionStatus } from "@/lib/transport";
import { LiveDot } from "@/components/ui";

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const seconds = total % 60;
  const minutes = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

const STATUS_META: Record<ConnectionStatus, { label: string; icon: typeof SignalHigh; tone: string }> = {
  connected: { label: "Connected", icon: SignalHigh, tone: "text-accent-300 border-accent-400/35 bg-accent-400/10" },
  connecting: { label: "Connecting…", icon: SignalMedium, tone: "text-signal-warn border-signal-warn/35 bg-signal-warn/10" },
  reconnecting: { label: "Reconnecting…", icon: SignalLow, tone: "text-signal-warn border-signal-warn/35 bg-signal-warn/10" },
  disconnected: { label: "Disconnected", icon: TriangleAlert, tone: "text-signal-live border-signal-live/35 bg-signal-live/10" },
  idle: { label: "Idle", icon: SignalLow, tone: "text-ivory-400 border-ink-600 bg-ink-800/60" },
};

export interface ClassroomHeaderProps {
  title: string;
  code: string;
  status: ConnectionStatus;
  startedAt: string | null;
  demo?: boolean;
  className?: string;
}

export function ClassroomHeader({
  title,
  code,
  status,
  startedAt,
  demo = false,
  className,
}: ClassroomHeaderProps) {
  const reduced = useReducedMotion() ?? false;
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(0);

  useEffect(() => {
    const start = startedAt ? new Date(startedAt).getTime() : Date.now();
    const tick = () => setElapsed(Date.now() - start);
    tick();
    timerRef.current = window.setInterval(tick, 1000);
    return () => window.clearInterval(timerRef.current);
  }, [startedAt]);

  const meta = STATUS_META[status];
  const StatusIcon = meta.icon;

  function copyCode() {
    try {
      void navigator.clipboard?.writeText(code);
    } catch {
      /* clipboard is optional */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), reduced ? 400 : 1600);
  }

  return (
    <header
      className={clsx(
        "flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-ink-700/70 bg-ink-900/85 px-3.5 py-2.5 backdrop-blur-xl sm:px-5",
        className,
      )}
    >
      <div className="min-w-0 flex-1 basis-44">
        <p className="nc-eyebrow flex items-center gap-2">
          <LiveDot />
          {demo ? "Demo classroom - simulated" : "Live classroom"}
        </p>
        <h1 className="truncate text-[15px] font-semibold text-ivory-50 sm:text-base">{title}</h1>
      </div>

      {demo ? (
        <span className="rounded-full border border-signal-warn/40 bg-signal-warn/12 px-2.5 py-1 text-2xs font-bold uppercase tracking-[0.14em] text-signal-warn">
          Demo - simulated
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-signal-live/40 bg-signal-live/10 px-2.5 py-1 text-2xs font-bold uppercase tracking-[0.14em] text-signal-live">
          <LiveDot />
          Live
          <span className="font-mono normal-case tracking-normal text-ivory-200" aria-label="Meeting duration">
            {formatDuration(elapsed)}
          </span>
        </span>
      )}

      <button
        type="button"
        onClick={copyCode}
        aria-label={`Copy meeting code ${code}`}
        className="nc-focus inline-flex h-8 items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-800/70 px-2.5 font-mono text-xs text-ivory-200 transition-colors hover:border-ink-500 hover:text-ivory-50"
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="check"
              initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
              transition={{ duration: reduced ? 0 : 0.16 }}
              className="text-accent-300"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
              transition={{ duration: reduced ? 0 : 0.16 }}
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            </motion.span>
          )}
        </AnimatePresence>
        {code}
      </button>

      <span
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-medium",
          meta.tone,
        )}
        title={meta.label}
      >
        <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">{meta.label}</span>
      </span>

      <span className="hidden items-center gap-1.5 rounded-full border border-ink-600 bg-ink-800/60 px-2.5 py-1 text-2xs text-ivory-300 xl:inline-flex">
        <Gauge className="h-3 w-3 text-accent-300" aria-hidden="true" />
        WebRTC mesh
      </span>
    </header>
  );
}
