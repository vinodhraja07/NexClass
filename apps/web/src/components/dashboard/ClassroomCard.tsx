import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  CalendarClock,
  Languages,
  Radio,
  Lock,
  Copy,
  Check,
  Link as LinkIcon,
  ExternalLink,
  Users,
} from "lucide-react";
import clsx from "clsx";
import { languageName, type MeetingPublic } from "@nexclass/shared";
import { LiveDot, Badge, Button } from "@/components/ui";
import { SPRINGS } from "@/lib/motion";

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.toLocaleDateString(undefined, { day: "numeric", month: "short" })} · ${date.toLocaleTimeString(
    undefined,
    { hour: "2-digit", minute: "2-digit" },
  )}`;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback */
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-9999px";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

export interface ClassroomCardProps {
  meeting: MeetingPublic;
  onEnter?: (code: string) => void;
  className?: string;
}

export function ClassroomCard({ meeting, onEnter, className }: ClassroomCardProps) {
  const navigate = useNavigate();
  const reduced = useReducedMotion() ?? false;

  const [origin, setOrigin] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const isLive = meeting.status === "live";
  const isEnded = meeting.status === "ended";
  const meetingUrl = `${origin}/meet/${meeting.code}`;

  const handleEnter = useCallback(() => {
    if (onEnter) {
      onEnter(meeting.code);
    } else {
      navigate(`/meet/${meeting.code}`);
    }
  }, [meeting.code, onEnter, navigate]);

  const handleCopyCode = useCallback(async () => {
    const ok = await copyToClipboard(meeting.code);
    if (ok) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  }, [meeting.code]);

  const handleCopyLink = useCallback(async () => {
    const ok = await copyToClipboard(meetingUrl);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }, [meetingUrl]);

  return (
    <motion.article
      whileHover={reduced ? undefined : { y: -3, transition: SPRINGS.card }}
      className={clsx(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 sm:p-6",
        "backdrop-blur-xl transition-[border-color,background-color,box-shadow,transform] duration-200",
        "border border-ink-600 bg-ink-800/60 shadow-[0_8px_30px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.035)]",
        "hover:border-accent-400 hover:bg-ink-800/85 hover:shadow-[0_20px_48px_-16px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.06),0_0_24px_rgba(120,169,139,0.12)]",
        isLive && "border-accent-300/50 bg-ink-800/80 shadow-[0_0_24px_-4px_rgba(50,185,138,0.22)]",
        className,
      )}
    >
      {/* Specular Ambient Glow */}
      <div
        className={clsx(
          "pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl transition-colors",
          isLive ? "bg-accent-300/20" : "bg-accent-400/10 group-hover:bg-accent-400/20",
        )}
      />

      {/* Top Header Row */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-300/40 bg-accent-300/15 px-2.5 py-0.5 text-3xs font-bold uppercase tracking-wider text-accent-300 shadow-[0_0_12px_rgba(50,185,138,0.3)]">
                <LiveDot />
                <span>LIVE NOW</span>
              </span>
            ) : isEnded ? (
              <Badge tone="neutral">Ended</Badge>
            ) : (
              <Badge tone="info">Scheduled</Badge>
            )}

            {meeting.settings.passwordEnabled && (
              <span className="inline-flex items-center gap-1 rounded-full border border-signal-warn/30 bg-signal-warn/15 px-2 py-0.5 text-3xs font-medium text-signal-warn">
                <Lock className="h-3 w-3" />
                <span>Protected</span>
              </span>
            )}
          </div>

          {/* Monospace Code Pill */}
          <span className="font-mono text-xs font-bold tracking-[0.2em] text-ivory-200 bg-ink-900/80 border border-ink-650 px-2.5 py-0.5 rounded-lg select-all">
            {meeting.code}
          </span>
        </div>

        {/* Meeting Title */}
        <h3 className="mt-3.5 line-clamp-2 font-display text-base font-bold text-ivory-50 tracking-tight group-hover:text-white transition-colors">
          {meeting.title}
        </h3>

        {/* Language Capabilities */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-accent-400/40 bg-accent-400/15 px-2 py-0.5 text-3xs font-semibold text-accent-200">
            <Languages className="h-3 w-3" />
            <span>Speaker: {languageName(meeting.speakerLanguage)}</span>
          </span>

          {(meeting.availableLanguages ?? [])
            .filter((code) => code !== meeting.speakerLanguage)
            .slice(0, 4)
            .map((code) => (
              <span
                key={code}
                className="rounded-full border border-ink-600/70 bg-ink-900/60 px-2 py-0.5 text-3xs font-medium text-ivory-300"
              >
                {languageName(code)}
              </span>
            ))}
        </div>

        {/* Timestamp */}
        <div className="mt-3 flex items-center gap-1.5 text-2xs text-ivory-400">
          <CalendarClock className="h-3.5 w-3.5 text-ivory-400/80" />
          <span>{formatTimestamp(meeting.createdAt)}</span>
        </div>
      </div>

      {/* Quick Action Deck */}
      <div className="mt-5 pt-4 border-t border-ink-650/80 flex flex-col gap-2.5">
        {/* 1-Click Enter Classroom Button */}
        <Button
          size="sm"
          variant={isLive ? "primary" : "secondary"}
          onClick={handleEnter}
          className="w-full text-xs font-semibold"
          icon={isLive ? <Radio className="h-3.5 w-3.5 animate-pulse" /> : <ExternalLink className="h-3.5 w-3.5" />}
        >
          {isLive ? "Enter Live Classroom" : isEnded ? "Reopen Classroom" : "Enter Classroom"}
        </Button>

        {/* Copy Link & Copy Code buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className={clsx(
              "nc-focus flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-2xs font-medium transition-colors",
              copiedLink
                ? "border-accent-300/50 bg-accent-300/15 text-accent-200"
                : "border-ink-600 bg-ink-900/60 text-ivory-300 hover:border-ink-500 hover:bg-ink-900 hover:text-ivory-100",
            )}
            title="Copy meeting share URL to clipboard"
          >
            {copiedLink ? <Check className="h-3 w-3 text-accent-300" /> : <LinkIcon className="h-3 w-3" />}
            <span>{copiedLink ? "Link Copied" : "Copy Link"}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCode}
            className={clsx(
              "nc-focus flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-2xs font-medium transition-colors",
              copiedCode
                ? "border-accent-300/50 bg-accent-300/15 text-accent-200"
                : "border-ink-600 bg-ink-900/60 text-ivory-300 hover:border-ink-500 hover:bg-ink-900 hover:text-ivory-100",
            )}
            title="Copy 6-character room code to clipboard"
          >
            {copiedCode ? <Check className="h-3 w-3 text-accent-300" /> : <Copy className="h-3 w-3" />}
            <span>{copiedCode ? "Code Copied" : "Copy Code"}</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}
