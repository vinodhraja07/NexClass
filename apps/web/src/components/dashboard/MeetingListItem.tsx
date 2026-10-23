import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Languages, Radio } from "lucide-react";
import clsx from "clsx";
import { languageName, type LanguageCode, type MeetingPublic } from "@nexclass/shared";
import { Badge, LiveDot } from "@/components/ui";
import { CopyButton } from "./CopyButton";

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.toLocaleDateString(undefined, { day: "numeric", month: "short" })} · ${date.toLocaleTimeString(
    undefined,
    { hour: "2-digit", minute: "2-digit" },
  )}`;
}

export interface MeetingListItemProps {
  meeting: MeetingPublic;
  /** Shown instead of the default language line, used for locally tracked joins. */
  note?: string;
  /** Overrides the derived status badge, for locally tracked history entries. */
  statusOverride?: { label: string; tone: "neutral" | "accent" | "live" | "warn" | "info" };
  showAction?: boolean;
}

export function MeetingListItem({
  meeting,
  note,
  statusOverride,
  showAction = true,
}: MeetingListItemProps) {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const link = `${origin}/meet/${meeting.code}`;
  const isLive = meeting.status === "live";
  const isEnded = meeting.status === "ended";
  const actionLabel = isLive ? "Resume" : isEnded ? "Reopen" : "Enter";

  return (
    <article
      className={clsx(
        "group relative flex flex-col gap-3 rounded-2xl border p-4 sm:p-5 transition-all duration-300 sm:flex-row sm:items-center sm:justify-between overflow-hidden",
        isLive
          ? "border-signal-live/50 bg-signal-live/[0.04] shadow-sm shadow-signal-live/10"
          : "border-ink-700/80 bg-ink-900/50 hover:border-accent-400/40 hover:bg-ink-850/60 hover:shadow-lg hover:shadow-black/40",
      )}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-accent-400/5 blur-2xl transition-colors group-hover:bg-accent-400/10" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {statusOverride ? (
            <Badge tone={statusOverride.tone}>{statusOverride.label}</Badge>
          ) : isLive ? (
            <Badge tone="live">
              <LiveDot /> Live
            </Badge>
          ) : isEnded ? (
            <Badge>Ended</Badge>
          ) : (
            <Badge tone="info">Scheduled</Badge>
          )}
          <span className="font-mono text-xs tracking-[0.22em] text-ivory-300">
            {meeting.code}
          </span>
          {meeting.settings.passwordEnabled ? <Badge tone="warn">Protected</Badge> : null}
        </div>

        <h3 className="mt-2 truncate font-display text-[15px] font-semibold text-ivory-50">
          {meeting.title}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {(meeting.availableLanguages ?? []).slice(0, 6).map((code) => (
            <span
              key={code}
              className={clsx(
                "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                code === meeting.speakerLanguage
                  ? "border-accent-400/40 bg-accent-400/10 text-accent-200"
                  : "border-ink-600 text-ivory-400",
              )}
            >
              {languageName(code)}
            </span>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-ivory-400">
          <span className="inline-flex items-center gap-1.5">
            <Languages className="h-3.5 w-3.5" aria-hidden="true" />
            Speaker: {languageName(meeting.speakerLanguage)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
            {formatTimestamp(meeting.createdAt)}
          </span>
          {note ? <span className="text-accent-300/90">{note}</span> : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <CopyButton value={link} label="Copy link" />
        {showAction ? (
          <Link
            to={`/meet/${meeting.code}`}
            className={clsx(
              "nc-focus inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-medium transition-colors duration-200",
              isLive
                ? "bg-accent-400 text-ink-900 hover:bg-accent-300"
                : "border border-ink-500/70 bg-ink-700/80 text-ivory-100 hover:bg-ink-600",
            )}
          >
            {isLive ? (
              <Radio className="h-3.5 w-3.5" aria-hidden="true" />
            ) : null}
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export interface MeetingListProps {
  meetings: MeetingPublic[];
  emptyMessage: string;
  notes?: Record<string, string>;
  statusOverrides?: Record<string, { label: string; tone: "neutral" | "accent" | "live" | "warn" | "info" }>;
}

export function MeetingList({ meetings, emptyMessage, notes, statusOverrides }: MeetingListProps) {
  if (meetings.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-ink-600 px-4 py-6 text-center text-2xs text-ivory-400">
        {emptyMessage}
      </p>
    );
  }
  return (
    <div className="space-y-2.5">
      {meetings.map((meeting) => (
        <MeetingListItem
          key={meeting.code}
          meeting={meeting}
          note={notes?.[meeting.code]}
          statusOverride={statusOverrides?.[meeting.code]}
        />
      ))}
    </div>
  );
}

export function languageSummary(codes: LanguageCode[]): string {
  return codes.map((code) => languageName(code)).join(", ");
}
