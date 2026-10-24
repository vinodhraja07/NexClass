import { motion, useReducedMotion } from "motion/react";
import type { MeetingPublic } from "@nexclass/shared";
import { HeroActionDeck } from "./HeroActionDeck";
import { ClassroomsGrid } from "./ClassroomsGrid";
import { RecentSessionsDrawer } from "./RecentSessionsDrawer";
import { pageVariants } from "@/lib/motion";

export interface ClassroomsViewProps {
  isTeacher: boolean;
  meetings: MeetingPublic[];
  recentMeetings: MeetingPublic[];
  loading?: boolean;
  onRefresh?: () => void;
  onCreateClick?: () => void;
  onNavigateTranscripts: () => void;
  onInstantCreateComplete?: (code: string) => void;
  className?: string;
}

export function ClassroomsView({
  isTeacher,
  meetings,
  recentMeetings,
  loading = false,
  onRefresh,
  onCreateClick,
  onNavigateTranscripts,
  onInstantCreateComplete,
  className,
}: ClassroomsViewProps) {
  const reduced = useReducedMotion() ?? false;

  return (
    <motion.div
      variants={pageVariants}
      initial={reduced ? undefined : "initial"}
      animate="animate"
      exit={reduced ? undefined : "exit"}
      className={className ?? "space-y-7"}
    >
      {/* 1. Hero Quick Action Deck */}
      <section aria-label="Quick Actions">
        <HeroActionDeck
          isTeacher={isTeacher}
          onInstantCreateComplete={onInstantCreateComplete}
        />
      </section>

      {/* 2. Active & Scheduled Classrooms Grid */}
      <section aria-label="Classrooms Grid" className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-ink-700/60">
          <div>
            <h2 className="font-display text-lg font-bold text-ivory-50 tracking-tight">
              {isTeacher ? "Classrooms Command Center" : "Enrolled Classrooms"}
            </h2>
            <p className="text-2xs text-ivory-300">
              {isTeacher
                ? "Live and scheduled multilingual virtual rooms. Launch, enter, or share access codes with students."
                : "Active classrooms available to enter with real-time translation and captions."}
            </p>
          </div>
        </div>

        <ClassroomsGrid
          meetings={meetings}
          loading={loading}
          onRefresh={onRefresh}
          isTeacher={isTeacher}
          onCreateClick={onCreateClick}
        />
      </section>

      {/* 3. Recent Sessions Quick-Glance Drawer */}
      {recentMeetings.length > 0 && (
        <section aria-label="Recent Sessions History">
          <RecentSessionsDrawer
            recentMeetings={recentMeetings}
            onNavigateTranscripts={onNavigateTranscripts}
          />
        </section>
      )}
    </motion.div>
  );
}
