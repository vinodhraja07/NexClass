import { motion, useReducedMotion } from "motion/react";
import {
  Copy,
  Languages,
  Link as LinkIcon,
  Lock,
  MessageSquare,
  MessageSquareOff,
  Mic,
  MicOff,
  MonitorOff,
  MonitorUp,
  Radio,
  Unlock,
} from "lucide-react";
import clsx from "clsx";
import { languageName, type LanguageCode } from "@nexclass/shared";
import { Button } from "@/components/ui";
import { SPRINGS } from "@/lib/motion";

export interface MeetingCardPreviewProps {
  title: string;
  speakerLanguage: LanguageCode;
  availableLanguages: LanguageCode[];
  passwordEnabled: boolean;
  participantPermissions: {
    canUnmute: boolean;
    canShareScreen: boolean;
    canChat: boolean;
  };
  captionsByDefault?: boolean;
  voiceByDefault?: boolean;
  hostName?: string;
  className?: string;
}

const ALL_CODES: LanguageCode[] = ["en", "ta", "hi", "bn", "mr", "or"];

export function MeetingCardPreview({
  title,
  speakerLanguage,
  availableLanguages,
  passwordEnabled,
  participantPermissions,
  captionsByDefault = true,
  voiceByDefault = true,
  hostName,
  className,
}: MeetingCardPreviewProps) {
  const reduced = useReducedMotion() ?? false;
  const trimmedTitle = title.trim();

  return (
    <motion.div
      layout={!reduced}
      transition={SPRINGS.card}
      className={clsx(
        "relative flex flex-col justify-between overflow-hidden rounded-2xl p-6",
        "bg-ink-950/80 backdrop-blur-xl border border-ink-700/60 shadow-panel",
        "transition-all duration-200",
        className,
      )}
      aria-label="Real-time classroom card preview"
    >
      {/* Specular Ambient Glow */}
      <div
        className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-accent-400/15 blur-3xl"
        aria-hidden="true"
      />

      {/* Header Row */}
      <div>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-300/40 bg-accent-300/15 px-2.5 py-0.5 text-3xs font-bold uppercase tracking-wider text-accent-300 shadow-[0_0_12px_rgba(50,185,138,0.25)]">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-300 animate-pulse" />
              <span>LIVE PREVIEW</span>
            </span>

            {passwordEnabled ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-signal-warn/30 bg-signal-warn/15 px-2 py-0.5 text-3xs font-medium text-signal-warn">
                <Lock className="h-3 w-3" />
                <span>Protected</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-ink-700/60 bg-ink-900/50 px-2 py-0.5 text-3xs font-medium text-ivory-400">
                <Unlock className="h-3 w-3" />
                <span>Open Access</span>
              </span>
            )}
          </div>

          {/* Simulated Monospace Room Code */}
          <span className="font-mono text-xs font-bold tracking-[0.25em] text-accent-300 bg-ink-900/90 border border-ink-650 px-2.5 py-1 rounded-lg shadow-inner select-all">
            NEX-PREVIEW
          </span>
        </div>

        {/* Classroom Title */}
        <div className="mt-4">
          <p className="nc-eyebrow text-accent-300 text-3xs">Classroom Title Preview</p>
          <h3
            className={clsx(
              "mt-1 font-display text-lg sm:text-xl font-bold tracking-tight line-clamp-2 transition-colors",
              trimmedTitle ? "text-ivory-50" : "text-ivory-400/60 italic font-normal",
            )}
          >
            {trimmedTitle || "Untitled Multilingual Classroom"}
          </h3>
          <p className="mt-1 text-2xs text-ivory-400">
            Instructor: <span className="text-ivory-200 font-medium">{hostName || "You (Teacher)"}</span>
          </p>
        </div>

        {/* Teacher Spoken Language Badge */}
        <div className="mt-4 space-y-1.5">
          <span className="text-3xs font-semibold uppercase tracking-wider text-ivory-400 block">
            Teacher Spoken Language
          </span>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-accent-400/40 bg-accent-400/15 px-3 py-1.5 text-xs font-semibold text-accent-200 shadow-[0_0_12px_rgba(120,169,139,0.15)]">
              <Languages className="h-3.5 w-3.5 text-accent-300" />
              <span>{languageName(speakerLanguage)}</span>
              <span className="font-mono text-3xs uppercase bg-accent-400/25 px-1.5 py-0.5 rounded text-accent-300">
                {speakerLanguage}
              </span>
            </span>
          </div>
        </div>

        {/* Student Caption Language Badges */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-3xs font-semibold uppercase tracking-wider text-ivory-400">
              Available Student Captions ({availableLanguages.length}/6)
            </span>
            <span className="text-3xs text-accent-300 font-medium">Real-Time Sync</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_CODES.map((code) => {
              const isEnabled = availableLanguages.includes(code);
              return (
                <span
                  key={code}
                  className={clsx(
                    "rounded-lg px-2.5 py-1 font-mono text-3xs font-bold uppercase transition-all border",
                    isEnabled
                      ? "border-accent-400/50 bg-accent-400/15 text-accent-200 shadow-sm"
                      : "border-ink-800 bg-ink-900/40 text-ivory-500 line-through opacity-45",
                  )}
                >
                  {code.toUpperCase()} · {languageName(code)}
                </span>
              );
            })}
          </div>
        </div>

        {/* Participant Permissions Pills */}
        <div className="mt-4 space-y-1.5">
          <span className="text-3xs font-semibold uppercase tracking-wider text-ivory-400 block">
            Participant In-Room Permissions
          </span>
          <div className="grid grid-cols-3 gap-2">
            <div
              className={clsx(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-3xs font-medium transition-colors",
                participantPermissions.canUnmute
                  ? "border-accent-400/35 bg-ink-900/70 text-ivory-200"
                  : "border-ink-800 bg-ink-950/60 text-ivory-500",
              )}
            >
              {participantPermissions.canUnmute ? (
                <Mic className="h-3.5 w-3.5 text-accent-300" />
              ) : (
                <MicOff className="h-3.5 w-3.5 text-signal-warn" />
              )}
              <span className="truncate">
                {participantPermissions.canUnmute ? "Mic: Allowed" : "Mic: Muted"}
              </span>
            </div>

            <div
              className={clsx(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-3xs font-medium transition-colors",
                participantPermissions.canShareScreen
                  ? "border-accent-400/35 bg-ink-900/70 text-ivory-200"
                  : "border-ink-800 bg-ink-950/60 text-ivory-500",
              )}
            >
              {participantPermissions.canShareScreen ? (
                <MonitorUp className="h-3.5 w-3.5 text-accent-300" />
              ) : (
                <MonitorOff className="h-3.5 w-3.5 text-signal-warn" />
              )}
              <span className="truncate">
                {participantPermissions.canShareScreen ? "Screen: Allowed" : "Screen: Off"}
              </span>
            </div>

            <div
              className={clsx(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-3xs font-medium transition-colors",
                participantPermissions.canChat
                  ? "border-accent-400/35 bg-ink-900/70 text-ivory-200"
                  : "border-ink-800 bg-ink-950/60 text-ivory-500",
              )}
            >
              {participantPermissions.canChat ? (
                <MessageSquare className="h-3.5 w-3.5 text-accent-300" />
              ) : (
                <MessageSquareOff className="h-3.5 w-3.5 text-signal-warn" />
              )}
              <span className="truncate">
                {participantPermissions.canChat ? "Chat: Active" : "Chat: Off"}
              </span>
            </div>
          </div>
        </div>

        {/* Defaults strip */}
        <div className="mt-3 flex items-center justify-between text-3xs text-ivory-400 border-t border-ink-800/60 pt-2.5">
          <span>Captions: <strong className="text-ivory-200 font-semibold">{captionsByDefault ? "Enabled" : "Disabled"}</strong></span>
          <span>Neural Voice: <strong className="text-ivory-200 font-semibold">{voiceByDefault ? "Enabled" : "Disabled"}</strong></span>
        </div>
      </div>

      {/* Simulated Action Bar */}
      <div className="mt-5 pt-4 border-t border-ink-700/60 space-y-2.5">
        <Button
          size="sm"
          disabled
          className="w-full text-xs font-semibold opacity-85 cursor-default"
          icon={<Radio className="h-3.5 w-3.5 text-accent-300 animate-pulse" />}
        >
          Enter Classroom (Preview)
        </Button>

        <div className="grid grid-cols-2 gap-2 opacity-65">
          <div className="flex items-center justify-center gap-1.5 rounded-lg border border-ink-700 bg-ink-900/60 px-2 py-1.5 text-3xs text-ivory-400 select-none">
            <LinkIcon className="h-3 w-3" />
            <span>Copy Link</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 rounded-lg border border-ink-700 bg-ink-900/60 px-2 py-1.5 text-3xs text-ivory-400 select-none">
            <Copy className="h-3 w-3" />
            <span>Copy Code</span>
          </div>
        </div>

        <p className="text-center text-3xs text-ivory-400/80 italic">
          Card updates live with every title keystroke and setting toggle.
        </p>
      </div>
    </motion.div>
  );
}
