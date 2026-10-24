import { Sparkles, Menu, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { Badge } from "@/components/ui";
import { Avatar } from "@/components/classroom/Avatar";
import type { DashboardView } from "./DashboardSidebar";

export interface DashboardMobileHeaderProps {
  onOpenMobile: () => void;
  user: {
    name: string;
    role: "teacher" | "student" | string;
    email?: string;
  } | null;
  isTeacher: boolean;
  activeView: DashboardView;
  onSelectView?: (view: DashboardView) => void;
}

const VIEW_TITLES: Record<DashboardView, string> = {
  classrooms: "Classrooms",
  create: "New Classroom",
  transcripts: "Transcripts & Archive",
  preferences: "Preferences & Languages",
};

export function DashboardMobileHeader({
  onOpenMobile,
  user,
  isTeacher,
  activeView,
  onSelectView,
}: DashboardMobileHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-ink-700/60 bg-ink-950/85 px-4 backdrop-blur-xl lg:hidden">
      <div className="flex items-center gap-3">
        {/* Hamburger Menu Button */}
        <button
          type="button"
          onClick={onOpenMobile}
          aria-label="Open navigation menu"
          className="nc-focus inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ink-700/70 bg-ink-900/60 text-ivory-200 transition-colors hover:border-ink-500 hover:bg-ink-800/80 hover:text-ivory-50 active:scale-95"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Brand Wordmark & Current View Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="nc-focus flex items-center gap-2 rounded-lg text-ivory-50"
            aria-label="NexClass Home"
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent-400/15 text-accent-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="font-display text-sm font-semibold tracking-tight">NexClass</span>
          </Link>
          <span className="text-ink-600 font-mono text-xs">/</span>
          <span className="text-xs font-medium text-ivory-300 truncate max-w-[120px] sm:max-w-[200px]">
            {VIEW_TITLES[activeView] || "Dashboard"}
          </span>
        </div>
      </div>

      {/* Right User & Role Indicator */}
      <div className="flex items-center gap-2.5">
        <Badge
          tone={isTeacher ? "accent" : "info"}
          className="hidden sm:inline-flex text-[11px] px-2 py-0.5"
        >
          {isTeacher ? "Teacher" : "Student"}
        </Badge>

        {isTeacher && onSelectView && activeView !== "create" && (
          <button
            type="button"
            onClick={() => onSelectView("create")}
            className="nc-focus inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent-400/15 px-2.5 text-xs font-medium text-accent-300 border border-accent-400/30 hover:bg-accent-400/25 transition-colors"
            title="Create Classroom"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden xs:inline">New</span>
          </button>
        )}

        {user && (
          <div
            className="relative cursor-pointer"
            onClick={onOpenMobile}
            title={`${user.name} (${user.role})`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpenMobile();
              }
            }}
          >
            <Avatar name={user.name} size="sm" className="ring-1 ring-ink-700/80" />
          </div>
        )}
      </div>
    </header>
  );
}
