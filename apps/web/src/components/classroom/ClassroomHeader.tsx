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

function formatRecTimer(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

const STATUS_META: Record<ConnectionStatus, { label: string; icon: typeof SignalHigh; tone: string }> = {
  connected: { label: "Connected", icon: SignalHigh, tone: "text-primary border-primary/35 bg-primary/10" },
  connecting: { label: "Connecting…", icon: SignalMedium, tone: "text-signal-warn border-signal-warn/35 bg-signal-warn/10" },
  reconnecting: { label: "Reconnecting…", icon: SignalLow, tone: "text-signal-warn border-signal-warn/35 bg-signal-warn/10" },
  disconnected: { label: "Disconnected", icon: TriangleAlert, tone: "text-signal-live border-signal-live/35 bg-signal-live/10" },
  idle: { label: "Idle", icon: SignalLow, tone: "text-text-secondary border-border bg-surface" },
};

export interface ClassroomHeaderProps {
  title: string;
  code: string;
  status: ConnectionStatus;
  startedAt: string | null;
  demo?: boolean;
  className?: string;
  isRecording?: boolean;
  recordingElapsed?: number;
}

export function ClassroomHeader({
  title,
  code,
  status,
  startedAt,
  demo = false,
  className,
  isRecording = false,
  recordingElapsed = 0,
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
        "flex h-12 shrink-0 items-center justify-between border-b border-border/80 bg-background/90 px-4 backdrop-blur-2xl sm:px-6 select-none",
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="truncate text-xs sm:text-sm font-semibold text-text-primary tracking-tight">
          {title}
        </h1>

        {isRecording && (
          <motion.span
            initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/60 bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-400 shadow-sm shadow-rose-500/20 select-none shrink-0"
            role="status"
            aria-label={`Recording active, elapsed time ${formatRecTimer(recordingElapsed)}`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={clsx(
                  "absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75",
                  !reduced && "animate-ping",
                )}
              />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
            <span>REC</span>
            <span className="font-mono font-medium normal-case tracking-normal text-rose-300">
              {formatRecTimer(recordingElapsed)}
            </span>
          </motion.span>
        )}

        {demo ? (
          <span className="rounded-full border border-signal-warn/40 bg-signal-warn/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-signal-warn">
            Demo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-signal-live/40 bg-signal-live/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-signal-live">
            <LiveDot />
            <span className="font-mono normal-case tracking-normal text-text-secondary" aria-label="Meeting duration">
              {formatDuration(elapsed)}
            </span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={copyCode}
          aria-label={`Copy meeting code ${code}`}
          className="nc-focus inline-flex h-7 items-center gap-1.5 rounded-lg border border-border/70 bg-surface/80 px-2 font-mono text-[11px] text-text-primary transition-colors hover:border-primary/50"
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="check"
                initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
                transition={{ duration: reduced ? 0 : 0.16 }}
                className="text-primary"
              >
                <Check className="h-3 w-3" aria-hidden="true" />
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
                transition={{ duration: reduced ? 0 : 0.16 }}
              >
                <Copy className="h-3 w-3" aria-hidden="true" />
              </motion.span>
            )}
          </AnimatePresence>
          {code}
        </button>

        <span
          className={clsx(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
            meta.tone,
          )}
          title={meta.label}
        >
          <StatusIcon className="h-3 w-3" aria-hidden="true" />
          <span className="hidden sm:inline">{meta.label}</span>
        </span>
      </div>
    </header>
  );
}
