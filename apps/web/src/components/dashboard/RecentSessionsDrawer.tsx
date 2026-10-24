import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ChevronDown, History, FileText, ArrowUpRight, CalendarClock, Languages, ExternalLink } from "lucide-react";
import clsx from "clsx";
import { languageName, type MeetingPublic } from "@nexclass/shared";
import { Button } from "@/components/ui";
import { SPRINGS } from "@/lib/motion";

export interface RecentSessionsDrawerProps {
  recentMeetings: MeetingPublic[];
  onNavigateTranscripts: () => void;
  className?: string;
  defaultExpanded?: boolean;
}

function formatSessionDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${d.toLocaleTimeString(
    undefined,
    { hour: "2-digit", minute: "2-digit" },
  )}`;
}

export function RecentSessionsDrawer({
  recentMeetings,
  onNavigateTranscripts,
  className,
  defaultExpanded = true,
}: RecentSessionsDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const reduced = useReducedMotion() ?? false;

  if (recentMeetings.length === 0) {
    return null;
  }

  return (
    <div
      className={clsx(
        "overflow-hidden rounded-2xl border border-ink-650/80 bg-ink-850/60 backdrop-blur-xl shadow-panel transition-colors",
        className,
      )}
    >
      {/* Header Bar with Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6 sm:py-4 border-b border-ink-700/60 bg-ink-900/40">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="nc-focus group flex items-center gap-2.5 text-left cursor-pointer"
          aria-expanded={isExpanded}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-ink-600 bg-ink-800 text-accent-300">
            <History className="h-4 w-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-bold text-ivory-100 group-hover:text-white transition-colors">
                Recent Completed Sessions
              </h3>
              <span className="font-mono text-3xs px-2 py-0.5 rounded-full bg-ink-750 text-ivory-300 border border-ink-650">
                {recentMeetings.length}
              </span>
            </div>
            <p className="text-3xs text-ivory-400">
              Quick-glance past classrooms with recorded transcripts and language archives
            </p>
          </div>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={SPRINGS.micro}
            className="ml-2 text-ivory-400 group-hover:text-ivory-200"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </button>

        {/* 1-Tap Jump to Transcripts View */}
        <Button
          size="sm"
          variant="secondary"
          onClick={onNavigateTranscripts}
          className="text-2xs font-semibold text-accent-200 hover:text-white"
          icon={<FileText className="h-3.5 w-3.5 text-accent-300" />}
          trailing={<ArrowUpRight className="h-3.5 w-3.5" />}
        >
          View All Transcripts
        </Button>
      </div>

      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={reduced ? { opacity: 1 } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="p-4 sm:p-5 space-y-2.5 divide-y divide-ink-700/40">
              {recentMeetings.slice(0, 5).map((m) => (
                <div
                  key={m.id || m.code}
                  className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-3xs font-semibold uppercase tracking-wider text-accent-300 bg-accent-400/10 px-2 py-0.5 rounded-md border border-accent-400/25">
                        {m.code}
                      </span>
                      <h4 className="font-medium text-ivory-100 truncate max-w-md">
                        {m.title}
                      </h4>
                    </div>

                    <div className="mt-1 flex items-center gap-3 text-3xs text-ivory-400">
                      <span className="inline-flex items-center gap-1">
                        <Languages className="h-3 w-3" />
                        {languageName(m.speakerLanguage)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        {formatSessionDate(m.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={onNavigateTranscripts}
                      className="nc-focus inline-flex items-center gap-1 rounded-lg border border-ink-650 bg-ink-900/60 px-2.5 py-1 text-3xs font-medium text-ivory-300 hover:border-ink-500 hover:bg-ink-800 hover:text-ivory-100 transition-colors cursor-pointer"
                    >
                      <FileText className="h-3 w-3 text-accent-300" />
                      <span>Transcript</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
