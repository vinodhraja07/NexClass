import { useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Search, RefreshCw, Radio, Layers, PlusCircle, Sparkles } from "lucide-react";
import clsx from "clsx";
import type { MeetingPublic } from "@nexclass/shared";
import { Button, LiveDot } from "@/components/ui";
import { ClassroomCard } from "./ClassroomCard";
import { SPRINGS } from "@/lib/motion";

export interface ClassroomsGridProps {
  meetings: MeetingPublic[];
  loading?: boolean;
  onRefresh?: () => void;
  isTeacher?: boolean;
  onCreateClick?: () => void;
  className?: string;
}

type FilterTab = "all" | "live" | "scheduled";

export function ClassroomsGrid({
  meetings,
  loading = false,
  onRefresh,
  isTeacher = true,
  onCreateClick,
  className,
}: ClassroomsGridProps) {
  const reduced = useReducedMotion() ?? false;
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const liveCount = useMemo(() => {
    return meetings.filter((m) => m.status === "live").length;
  }, [meetings]);

  const scheduledCount = useMemo(() => {
    return meetings.filter((m) => m.status !== "live" && m.status !== "ended").length;
  }, [meetings]);

  const filteredMeetings = useMemo(() => {
    let list = [...meetings];

    // Status filter
    if (activeFilter === "live") {
      list = list.filter((m) => m.status === "live");
    } else if (activeFilter === "scheduled") {
      list = list.filter((m) => m.status !== "live" && m.status !== "ended");
    }

    // Text search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.code.toLowerCase().includes(q) ||
          m.speakerLanguage.toLowerCase().includes(q),
      );
    }

    // Sort live meetings first, then descending creation date
    return list.sort((a, b) => {
      if (a.status === "live" && b.status !== "live") return -1;
      if (b.status === "live" && a.status !== "live") return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [meetings, activeFilter, searchQuery]);

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-ink-900/80 border border-ink-650/80 backdrop-blur-md self-start">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={clsx(
              "nc-focus flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-semibold transition-all cursor-pointer",
              activeFilter === "all"
                ? "bg-ink-750 text-ivory-50 shadow-xs border border-ink-600"
                : "text-ivory-400 hover:text-ivory-200",
            )}
          >
            <span>All Classrooms</span>
            <span className="font-mono text-3xs px-1.5 py-0.2 rounded-full bg-ink-900 text-ivory-300">
              {meetings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("live")}
            className={clsx(
              "nc-focus flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-semibold transition-all cursor-pointer",
              activeFilter === "live"
                ? "bg-accent-300/20 text-accent-200 shadow-xs border border-accent-300/40"
                : "text-ivory-400 hover:text-ivory-200",
            )}
          >
            <LiveDot />
            <span>Live Now</span>
            {liveCount > 0 && (
              <span className="font-mono text-3xs px-1.5 py-0.2 rounded-full bg-accent-300/30 text-accent-100 font-bold">
                {liveCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("scheduled")}
            className={clsx(
              "nc-focus flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-semibold transition-all cursor-pointer",
              activeFilter === "scheduled"
                ? "bg-ink-750 text-ivory-50 shadow-xs border border-ink-600"
                : "text-ivory-400 hover:text-ivory-200",
            )}
          >
            <span>Scheduled</span>
            <span className="font-mono text-3xs px-1.5 py-0.2 rounded-full bg-ink-900 text-ivory-300">
              {scheduledCount}
            </span>
          </button>
        </div>

        {/* Right Actions: Search + Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ivory-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or code…"
              className="nc-focus h-9 w-full rounded-xl border border-ink-650 bg-ink-900/80 pl-9 pr-3 text-xs text-ivory-100 placeholder:text-ivory-400/50"
            />
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              aria-label="Refresh classrooms"
              className="nc-focus p-2 rounded-xl border border-ink-650 bg-ink-900/80 text-ivory-300 hover:border-ink-500 hover:text-ivory-100 transition-colors cursor-pointer"
              title="Refresh classrooms"
            >
              <RefreshCw className={clsx("h-4 w-4", loading && "animate-spin")} />
            </button>
          )}
        </div>
      </div>

      {/* Grid Container */}
      {filteredMeetings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredMeetings.map((meeting) => (
            <ClassroomCard key={meeting.id || meeting.code} meeting={meeting} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-ink-650/80 bg-ink-850/40 p-10 text-center backdrop-blur-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-ink-600 bg-ink-800 text-accent-300 shadow-md">
            <Layers className="h-6 w-6" />
          </div>

          <h4 className="mt-4 font-display text-base font-bold text-ivory-100">
            {searchQuery
              ? `No classrooms match "${searchQuery}"`
              : activeFilter === "live"
                ? "No classrooms currently live"
                : "No classrooms found"}
          </h4>
          <p className="mt-1.5 max-w-sm text-xs text-ivory-300 leading-relaxed">
            {searchQuery
              ? "Try adjusting your search keywords or clear the filter."
              : isTeacher
                ? "Start teaching instantly using the 1-click meeting deck above or configure a custom classroom."
                : "No active classrooms available. Ask your teacher for a 6-character room code to join."}
          </p>

          {isTeacher && onCreateClick && !searchQuery && (
            <div className="mt-5">
              <Button
                size="sm"
                variant="secondary"
                onClick={onCreateClick}
                icon={<PlusCircle className="h-4 w-4 text-accent-300" />}
              >
                Configure New Classroom
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
