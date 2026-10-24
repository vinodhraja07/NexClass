import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Calendar,
  Check,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Languages,
  Radio,
  RefreshCw,
  Search,
  Video,
  X,
} from "lucide-react";
import clsx from "clsx";
import {
  languageName,
  type LanguageCode,
  type MeetingPublic,
} from "@nexclass/shared";
import { ALL_LANGUAGE_CODES } from "@/components/dashboard/LanguageChips";
import { api } from "@/lib/api";
import { type RecordingPublic } from "@/hooks/useMeetingRecording";
import { exportTranscript } from "@/lib/exportTranscript";
import { Badge, Button, Input } from "@/components/ui";
import { SPRINGS } from "@/lib/motion";

export type DateFilter = "all" | "today" | "7d" | "30d";

export interface TranscriptsViewProps {
  meetings: MeetingPublic[];
  loading?: boolean;
  onRefresh?: () => void;
  onNavigateClassrooms?: () => void;
  className?: string;
}

export function TranscriptsView({
  meetings,
  loading = false,
  onRefresh,
  onNavigateClassrooms,
  className,
}: TranscriptsViewProps) {
  const navigate = useNavigate();
  const reduced = useReducedMotion() ?? false;

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<"all" | LanguageCode>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  // Per-meeting exporting state
  const [exportingMap, setExportingMap] = useState<Record<string, boolean>>({});
  // Per-meeting recordings cache
  const [recordingsMap, setRecordingsMap] = useState<Record<string, RecordingPublic[]>>({});
  // Floating toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // Fetch recordings for visible meetings
  useEffect(() => {
    let active = true;
    for (const m of meetings.slice(0, 20)) {
      if (recordingsMap[m.code] !== undefined) continue;
      void api
        .recordings(m.code)
        .then((res) => {
          if (!active) return;
          if (res?.ok && Array.isArray(res.recordings)) {
            setRecordingsMap((prev) => ({ ...prev, [m.code]: res.recordings }));
          }
        })
        .catch(() => {
          /* optional/silent fallback */
        });
    }
    return () => {
      active = false;
    };
  }, [meetings, recordingsMap]);

  // Filter meetings based on search, language, and date range
  const filteredMeetings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const now = Date.now();

    return meetings.filter((meeting) => {
      // 1. Text Search: Title or Room Code
      if (query) {
        const titleMatch = meeting.title?.toLowerCase().includes(query);
        const codeMatch = meeting.code?.toLowerCase().includes(query);
        if (!titleMatch && !codeMatch) return false;
      }

      // 2. Language Filter
      if (selectedLanguage !== "all") {
        const speakerMatches = meeting.speakerLanguage === selectedLanguage;
        const availableMatches = meeting.availableLanguages?.includes(selectedLanguage);
        if (!speakerMatches && !availableMatches) return false;
      }

      // 3. Date Range Filter
      if (dateFilter !== "all") {
        const createdAtTime = meeting.createdAt ? new Date(meeting.createdAt).getTime() : 0;
        if (!createdAtTime) return false;

        if (dateFilter === "today") {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          if (createdAtTime < startOfToday.getTime()) return false;
        } else if (dateFilter === "7d") {
          const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
          if (createdAtTime < sevenDaysAgo) return false;
        } else if (dateFilter === "30d") {
          const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
          if (createdAtTime < thirtyDaysAgo) return false;
        }
      }

      return true;
    });
  }, [meetings, searchQuery, selectedLanguage, dateFilter]);

  // 1-Click Export TXT Handler
  const handleExport = useCallback(
    async (meeting: MeetingPublic) => {
      setExportingMap((prev) => ({ ...prev, [meeting.code]: true }));
      try {
        const result = await exportTranscript(meeting);
        showToast(`Exported "${result.filename}" successfully`);
      } catch (error) {
        console.error("Export transcript failed:", error);
        showToast(`Failed to export transcript for #${meeting.code}`);
      } finally {
        setExportingMap((prev) => ({ ...prev, [meeting.code]: false }));
      }
    },
    [showToast],
  );

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedLanguage("all");
    setDateFilter("all");
  }, []);

  const hasActiveFilters = searchQuery !== "" || selectedLanguage !== "all" || dateFilter !== "all";

  return (
    <div className={clsx("space-y-6 relative", className)}>
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-accent-400/50 bg-ink-950/95 px-5 py-3.5 text-xs font-semibold text-ivory-100 shadow-2xl backdrop-blur-xl"
            role="status"
            aria-live="polite"
          >
            <div className="grid h-6 w-6 place-items-center rounded-full bg-accent-400/20 text-accent-300">
              <Check className="h-3.5 w-3.5" />
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Header */}
      <div className="rounded-2xl border border-ink-650/80 bg-ink-900/60 p-6 sm:p-7 shadow-panel backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-ink-700/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="nc-eyebrow text-accent-300">Classroom Archives</span>
              <span className="font-mono text-3xs text-ivory-400 uppercase bg-ink-800/80 px-2 py-0.5 rounded border border-ink-700">
                Synchronized
              </span>
            </div>
            <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold tracking-tight text-ivory-50">
              Transcripts &amp; Lecture History
            </h2>
            <p className="mt-1 text-xs text-ivory-300">
              Search past sessions, filter by Indian language or date, and export synchronized transcripts in 1 click.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                aria-label="Refresh session archives"
              >
                <RefreshCw
                  className={clsx("h-3.5 w-3.5", loading && "animate-spin text-accent-300")}
                  aria-hidden="true"
                />
                <span>Refresh</span>
              </Button>
            )}
          </div>
        </div>

        {/* Clean Search & Filter Bar */}
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input (7 cols) */}
            <div className="md:col-span-7 relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ivory-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sessions by title or 6-char room code…"
                className="w-full rounded-xl border border-ink-700/80 bg-ink-950/80 py-2.5 pl-10 pr-9 text-xs text-ivory-100 placeholder-ivory-400 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400/40 transition-colors"
                aria-label="Search sessions"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-ivory-400 hover:text-ivory-200"
                  aria-label="Clear search query"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Date Range Filter Selector (5 cols) */}
            <div className="md:col-span-5 flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-3xs uppercase tracking-wider text-ivory-400 font-semibold shrink-0 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-accent-300" />
                <span>Date:</span>
              </span>
              {(
                [
                  { id: "all", label: "All Time" },
                  { id: "today", label: "Today" },
                  { id: "7d", label: "Past 7 Days" },
                  { id: "30d", label: "Past 30 Days" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setDateFilter(f.id)}
                  className={clsx(
                    "nc-focus rounded-lg px-2.5 py-1.5 text-3xs font-semibold shrink-0 transition-colors border",
                    dateFilter === f.id
                      ? "border-accent-400 bg-accent-400/15 text-accent-300 shadow-sm"
                      : "border-ink-750 bg-ink-950/60 text-ivory-300 hover:border-ink-600 hover:text-ivory-100",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-ink-800/60">
            <span className="text-3xs uppercase tracking-wider text-ivory-400 font-semibold mr-1 flex items-center gap-1">
              <Languages className="h-3 w-3 text-accent-300" />
              <span>Language:</span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedLanguage("all")}
              className={clsx(
                "nc-focus rounded-lg px-2.5 py-1 text-3xs font-semibold transition-colors border",
                selectedLanguage === "all"
                  ? "border-accent-400 bg-accent-400/20 text-accent-200"
                  : "border-ink-750 bg-ink-950/60 text-ivory-300 hover:border-ink-600 hover:text-ivory-100",
              )}
            >
              All Languages
            </button>

            {ALL_LANGUAGE_CODES.map((code: LanguageCode) => {
              const isSelected = selectedLanguage === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSelectedLanguage(code)}
                  className={clsx(
                    "nc-focus rounded-lg px-2.5 py-1 font-mono text-3xs font-bold uppercase transition-colors border",
                    isSelected
                      ? "border-accent-400 bg-accent-400/20 text-accent-200"
                      : "border-ink-750 bg-ink-950/60 text-ivory-300 hover:border-ink-600 hover:text-ivory-100",
                  )}
                >
                  {code.toUpperCase()} · {languageName(code)}
                </button>
              );
            })}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="ml-auto text-3xs text-accent-300 hover:text-accent-200 underline cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Results Count Bar */}
        <div className="mt-4 flex items-center justify-between text-2xs text-ivory-400 border-t border-ink-800/60 pt-3">
          <span>
            Showing <strong className="text-ivory-100 font-semibold">{filteredMeetings.length}</strong> of{" "}
            <strong className="text-ivory-100 font-semibold">{meetings.length}</strong> recorded sessions
          </span>
          {hasActiveFilters && (
            <span className="text-3xs text-accent-300 font-mono">Filtered view</span>
          )}
        </div>
      </div>

      {/* Archive List / Cards */}
      {filteredMeetings.length === 0 ? (
        <div className="rounded-2xl border border-ink-700/80 bg-ink-900/40 p-12 text-center backdrop-blur-xl">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ink-800/80 text-accent-300 border border-ink-700">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-ivory-100">
            {meetings.length === 0 ? "No archived sessions yet" : "No matching sessions found"}
          </h3>
          <p className="mt-1 text-xs text-ivory-400 max-w-md mx-auto">
            {meetings.length === 0
              ? "When you finish an interactive classroom lecture, your synchronized transcripts across English, Tamil, Hindi, Bengali, Marathi, and Odia will be archived here."
              : "Try adjusting your search query, selecting another language filter, or clearing date restrictions."}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            {hasActiveFilters ? (
              <Button size="sm" variant="secondary" onClick={handleResetFilters}>
                Clear Search &amp; Filters
              </Button>
            ) : onNavigateClassrooms ? (
              <Button size="sm" onClick={onNavigateClassrooms}>
                Launch a Classroom
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredMeetings.map((meeting) => {
            const isExporting = Boolean(exportingMap[meeting.code]);
            const recordings = recordingsMap[meeting.code] || [];
            const hasRecording = recordings.length > 0;
            const primaryRecording = recordings[0];

            return (
              <motion.article
                key={meeting.id || meeting.code}
                layout={!reduced}
                transition={SPRINGS.card}
                className={clsx(
                  "group relative flex flex-col md:flex-row md:items-center justify-between gap-5 rounded-2xl p-5 sm:p-6",
                  "bg-ink-950/80 backdrop-blur-xl border border-ink-700/70 shadow-panel",
                  "hover:border-accent-400/50 hover:bg-ink-900/80 transition-all duration-200",
                )}
              >
                {/* Left/Middle Column: Info & Multilingual Badges */}
                <div className="min-w-0 flex-1 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold tracking-[0.2em] text-accent-300 bg-ink-900/90 border border-ink-650 px-2.5 py-0.5 rounded-lg select-all">
                      #{meeting.code}
                    </span>

                    <span className="inline-flex items-center gap-1 text-2xs text-ivory-400">
                      <Clock className="h-3 w-3 text-ivory-400/80" />
                      <span>
                        {meeting.createdAt
                          ? new Date(meeting.createdAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "Recent Session"}
                      </span>
                    </span>

                    {meeting.status === "live" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-300/40 bg-accent-300/15 px-2 py-0.5 text-3xs font-bold uppercase text-accent-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent-300 animate-pulse" />
                        <span>Live Session</span>
                      </span>
                    ) : (
                      <Badge tone="neutral">Archived</Badge>
                    )}

                    {hasRecording && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-signal-live/40 bg-signal-live/15 px-2 py-0.5 text-3xs font-semibold text-signal-live">
                        <Video className="h-3 w-3" />
                        <span>Recording Saved</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-base sm:text-lg font-bold text-ivory-50 tracking-tight line-clamp-2 group-hover:text-white transition-colors">
                    {meeting.title}
                  </h3>

                  {/* Multi-Language Badges (EN, TA, HI, BN, MR, OR) */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-3xs uppercase tracking-wider text-ivory-400 font-semibold mr-1">
                      Languages:
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-accent-400/40 bg-accent-400/15 px-2 py-0.5 text-3xs font-bold text-accent-200">
                      {meeting.speakerLanguage?.toUpperCase()} (Speaker)
                    </span>
                    {(meeting.availableLanguages || ALL_LANGUAGE_CODES)
                      .filter((c: LanguageCode) => c !== meeting.speakerLanguage)
                      .map((code: LanguageCode) => (
                        <span
                          key={code}
                          className="rounded-md border border-ink-700/80 bg-ink-900/60 px-2 py-0.5 font-mono text-3xs font-medium uppercase text-ivory-300"
                        >
                          {code.toUpperCase()} · {languageName(code)}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Right Action Column */}
                <div className="flex flex-wrap md:flex-col lg:flex-row items-center gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-ink-700/60">
                  {/* 1-Click "Export TXT" button */}
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={isExporting}
                    onClick={() => void handleExport(meeting)}
                    icon={<Download className="h-3.5 w-3.5 text-accent-300" />}
                    title="Export clean synchronized transcript document (.txt)"
                  >
                    {isExporting ? "Compiling…" : "Export TXT"}
                  </Button>

                  {/* Optional Recording Download button if video exists */}
                  {hasRecording && primaryRecording?.downloadUrl && (
                    <a
                      href={primaryRecording.downloadUrl}
                      download={primaryRecording.fileName || `recording-${meeting.code}.webm`}
                      className="nc-focus inline-flex items-center gap-1.5 rounded-xl border border-ink-650 bg-ink-900/80 px-3 py-1.5 text-2xs font-semibold text-ivory-200 hover:border-accent-400/40 hover:bg-ink-850 hover:text-white transition-colors"
                      title="Download recorded lecture audio & video"
                    >
                      <Video className="h-3 w-3 text-signal-live" />
                      <span>Video</span>
                    </a>
                  )}

                  {/* "Reopen Session" action button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/meet/${meeting.code}`)}
                    icon={<ExternalLink className="h-3.5 w-3.5" />}
                    title="Re-enter classroom room"
                  >
                    Reopen Session
                  </Button>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {/* Explainer Panel: How Transcripts Work */}
      <div className="rounded-2xl border border-ink-700/60 bg-ink-900/40 p-5 sm:p-6 backdrop-blur-xl">
        <h4 className="font-display text-sm font-semibold text-ivory-50 mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-accent-300" />
          <span>How NexClass Multilingual Transcripts Work</span>
        </h4>
        <div className="grid gap-4 sm:grid-cols-3 text-2xs text-ivory-300">
          <div className="rounded-xl border border-ink-700/40 bg-ink-950/60 p-3.5 space-y-1">
            <p className="font-semibold text-ivory-100">1. Original Speech Transcription</p>
            <p className="text-ivory-400">
              WebRTC audio is processed in real time, capturing vocabulary and mathematical terms precisely.
            </p>
          </div>
          <div className="rounded-xl border border-ink-700/40 bg-ink-950/60 p-3.5 space-y-1">
            <p className="font-semibold text-ivory-100">2. 6-Way Neural Subtitles</p>
            <p className="text-ivory-400">
              Every sentence is localized across Tamil, Hindi, Bengali, Marathi, and Odia simultaneously.
            </p>
          </div>
          <div className="rounded-xl border border-ink-700/40 bg-ink-950/60 p-3.5 space-y-1">
            <p className="font-semibold text-ivory-100">3. 1-Click Offline Export</p>
            <p className="text-ivory-400">
              Export complete chronological logs as formatted `.txt` files for offline study anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
