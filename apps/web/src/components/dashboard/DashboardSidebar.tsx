import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  Sparkles,
  LayoutGrid,
  PlusCircle,
  FileText,
  Languages,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  Radio,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import clsx from "clsx";
import type { ProviderStatusData } from "./ProviderStatusBar";
import { Avatar } from "@/components/classroom/Avatar";
import { Badge } from "@/components/ui";

export type DashboardView = "classrooms" | "create" | "transcripts" | "preferences";

export interface DashboardSidebarProps {
  currentView?: DashboardView;
  activeView?: DashboardView;
  onSelectView?: (view: DashboardView) => void;
  onViewChange?: (view: DashboardView) => void;
  isCollapsed?: boolean;
  collapsed?: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  mobileOpen?: boolean;
  onCloseMobile: () => void;
  activeClassroomsCount?: number;
  activeCount?: number;
  completedClassroomsCount?: number;
  historyCount?: number;
  user: {
    id?: string;
    name: string;
    email?: string;
    role: "teacher" | "student" | string;
    preferredLanguage?: string;
  } | null;
  serverStatus: ProviderStatusData | null;
  serverLoading?: boolean;
  serverError?: string | null;
  onRefreshServerStatus?: () => void;
  onLogout?: () => void;
  onSignOut?: () => void;
}

interface NavItemConfig {
  id: DashboardView;
  label: string;
  icon: typeof LayoutGrid;
  description: string;
  badge?: number | string | null;
  isQuickAction?: boolean;
  teacherOnly?: boolean;
}

export function DashboardSidebar(props: DashboardSidebarProps) {
  // Normalize prop variants
  const activeView = props.currentView ?? props.activeView ?? "classrooms";
  const selectView = props.onSelectView ?? props.onViewChange ?? (() => {});
  const isCollapsed = props.isCollapsed ?? props.collapsed ?? false;
  const isMobileOpen = props.isMobileOpen ?? props.mobileOpen ?? false;
  const activeCount = props.activeClassroomsCount ?? props.activeCount ?? 0;
  const completedCount = props.completedClassroomsCount ?? props.historyCount ?? 0;
  const handleLogout = props.onLogout ?? props.onSignOut ?? (() => {});

  const reduced = useReducedMotion() ?? false;
  const isTeacher = props.user?.role === "teacher";

  // Hover state for collapsed tooltip
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  // Expandable server health popover in footer
  const [showStatusPopover, setShowStatusPopover] = useState(false);

  // Close mobile drawer on Escape key press
  useEffect(() => {
    if (!isMobileOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        props.onCloseMobile();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, props]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobileOpen]);

  const navItems: NavItemConfig[] = [
    {
      id: "classrooms",
      label: "Classrooms",
      icon: LayoutGrid,
      description: "Active and upcoming sessions",
      badge: activeCount > 0 ? `${activeCount} live` : null,
    },
    {
      id: "create",
      label: "Create Classroom",
      icon: PlusCircle,
      description: "Start or configure a class",
      isQuickAction: true,
      teacherOnly: true,
    },
    {
      id: "transcripts",
      label: "Transcripts & Archive",
      icon: FileText,
      description: "Search multilingual archives",
      badge: completedCount > 0 ? `${completedCount}` : null,
    },
    {
      id: "preferences",
      label: "Preferences & Languages",
      icon: Languages,
      description: "Language presets and dark theme",
    },
  ];

  // System health breakdown
  const turnHealthy =
    props.serverStatus?.providers.find((p) => p.category === "turn")?.configured ?? true;
  const ttsHealthy =
    props.serverStatus?.providers.find((p) => p.category === "tts")?.configured ?? true;
  const asrHealthy =
    props.serverStatus?.providers.find((p) => p.category === "asr")?.configured ?? true;
  const translationHealthy =
    props.serverStatus?.providers.find((p) => p.category === "translation")?.configured ?? true;
  const dbHealthy = props.serverStatus?.infrastructure.mongodb.connected ?? true;
  const overallHealthy =
    props.serverStatus !== null &&
    !props.serverError &&
    turnHealthy &&
    ttsHealthy &&
    asrHealthy &&
    translationHealthy &&
    dbHealthy;

  const renderNavList = (isMobile: boolean = false) => {
    return (
      <nav aria-label="Dashboard navigation" className="space-y-1.5 px-3">
        {navItems.map((item) => {
          // If teacher-only and current user is student, hide on sidebar or render disabled
          if (item.teacherOnly && !isTeacher) {
            return null;
          }

          const isActive = activeView === item.id;
          const showTooltip = !isMobile && isCollapsed && hoveredItem === item.id;

          return (
            <div
              key={item.id}
              className="relative"
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <button
                type="button"
                onClick={() => {
                  selectView(item.id);
                  if (isMobile) props.onCloseMobile();
                }}
                className={clsx(
                  "group nc-focus relative flex w-full items-center rounded-xl transition-all duration-200 select-none",
                  isCollapsed && !isMobile
                    ? "justify-center h-12 w-12 mx-auto"
                    : "gap-3 px-3.5 py-2.5",
                  isActive
                    ? item.isQuickAction
                      ? "bg-accent-400/20 text-accent-300 font-semibold shadow-[0_0_20px_-4px_rgba(66,220,197,0.3)] border border-accent-400/40"
                      : "bg-ink-800/80 text-ivory-50 font-semibold border border-ink-600/70 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                    : item.isQuickAction
                      ? "bg-accent-400/10 text-accent-300 hover:bg-accent-400/20 hover:text-ivory-50 border border-accent-400/25"
                      : "text-ivory-300 hover:bg-ink-800/40 hover:text-ivory-100 hover:border-ink-700/50 border border-transparent",
                )}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
              >
                {/* Active indicator bar */}
                {isActive && (!isCollapsed || isMobile) && (
                  <motion.div
                    layoutId={isMobile ? "mobileActiveIndicator" : "desktopActiveIndicator"}
                    className={clsx(
                      "absolute left-0 top-2 bottom-2 w-1 rounded-r-full",
                      item.isQuickAction ? "bg-accent-400" : "bg-emerald-400",
                    )}
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}

                {/* Nav Item Icon */}
                <span
                  className={clsx(
                    "grid shrink-0 place-items-center transition-transform duration-200 group-hover:scale-110",
                    isCollapsed && !isMobile ? "h-6 w-6" : "h-5 w-5",
                    isActive
                      ? item.isQuickAction
                        ? "text-accent-300"
                        : "text-emerald-400"
                      : "text-ivory-400 group-hover:text-ivory-200",
                  )}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>

                {/* Nav Item Label & Badge (when expanded or on mobile) */}
                {(!isCollapsed || isMobile) && (
                  <div className="flex flex-1 items-center justify-between overflow-hidden text-left">
                    <span className="truncate text-sm tracking-tight">{item.label}</span>
                    {item.badge && (
                      <span
                        className={clsx(
                          "ml-2 shrink-0 rounded-full px-2 py-0.5 font-mono text-2xs font-semibold uppercase tracking-wider",
                          item.id === "classrooms" && activeCount > 0
                            ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
                            : "bg-ink-700/70 text-ivory-300 border border-ink-600/50",
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>

              {/* Floating Glass Tooltip in Collapsed Rail Mode */}
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={reduced ? { opacity: 1 } : { opacity: 0, x: -6, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, x: -4, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="pointer-events-none absolute left-full top-1/2 ml-3.5 -translate-y-1/2 z-50 rounded-xl border border-ink-600/80 bg-ink-900/95 px-3 py-1.5 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-ivory-50">{item.label}</span>
                      {item.badge && (
                        <span className="rounded-full bg-emerald-400/20 px-1.5 py-0.2 font-mono text-3xs font-bold text-emerald-300">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="block text-3xs text-ivory-400 font-normal">
                      {item.description}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>
    );
  };

  const renderFooter = (isMobile: boolean = false) => {
    return (
      <div className="mt-auto border-t border-ink-700/60 bg-ink-950/40 p-3">
        {/* Status Beacon Trigger */}
        <div className="relative mb-2">
          <button
            type="button"
            onClick={() => setShowStatusPopover((prev) => !prev)}
            aria-expanded={showStatusPopover}
            aria-label="Server and WebRTC status details"
            className={clsx(
              "nc-focus group flex w-full items-center rounded-xl border border-ink-700/50 bg-ink-900/40 transition-colors hover:border-ink-600 hover:bg-ink-900/70",
              isCollapsed && !isMobile ? "justify-center p-2.5" : "gap-3 px-3 py-2",
            )}
            title="Infrastructure & WebRTC Connection Status"
          >
            {/* Pulsing Beacon Dot */}
            <span className="relative flex h-3 w-3 shrink-0 items-center justify-center">
              {overallHealthy ? (
                <>
                  {!reduced && (
                    <motion.span
                      animate={{ scale: [1, 1.8, 1], opacity: [0.75, 0, 0.75] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute h-full w-full rounded-full bg-emerald-400"
                    />
                  )}
                  <span className="relative h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#2EE0A8]" />
                </>
              ) : (
                <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_#FBBF24]" />
              )}
            </span>

            {/* Expanded Status Text */}
            {(!isCollapsed || isMobile) && (
              <div className="flex flex-1 items-center justify-between overflow-hidden text-left">
                <div className="truncate">
                  <p className="text-2xs font-semibold text-ivory-200">
                    {overallHealthy ? "Mesh & Neural TTS Online" : "Degraded / Offline"}
                  </p>
                  <p className="text-3xs text-ivory-400 truncate">
                    WebRTC STUN · Neural TTS
                  </p>
                </div>
                <Activity className="h-3.5 w-3.5 text-ivory-400 group-hover:text-ivory-200 shrink-0 ml-1" />
              </div>
            )}
          </button>

          {/* System Status Details Popover */}
          <AnimatePresence>
            {showStatusPopover && (
              <motion.div
                initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className={clsx(
                  "absolute bottom-full mb-2 z-50 w-72 rounded-2xl border border-ink-600/80 bg-ink-950/95 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-2xl text-ivory-100",
                  isCollapsed && !isMobile ? "left-0 ml-14" : "left-0 right-0",
                )}
              >
                <div className="flex items-center justify-between border-b border-ink-700/60 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-accent-300" />
                    <span className="font-display text-xs font-semibold">System Diagnostics</span>
                  </div>
                  {props.onRefreshServerStatus && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        props.onRefreshServerStatus?.();
                      }}
                      className="nc-focus p-1 rounded hover:bg-ink-800 text-ivory-400 hover:text-ivory-100"
                      title="Refresh status"
                    >
                      <RefreshCw
                        className={clsx("h-3.5 w-3.5", props.serverLoading && "animate-spin")}
                      />
                    </button>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-ivory-300">Speech Recognition (ASR)</span>
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1 font-mono text-3xs font-medium px-2 py-0.5 rounded-full",
                        asrHealthy
                          ? "bg-emerald-400/15 text-emerald-300"
                          : "bg-amber-400/15 text-amber-300",
                      )}
                    >
                      {asrHealthy ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      {asrHealthy ? "Active" : "Zero-Key"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-ivory-300">Neural Translation</span>
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1 font-mono text-3xs font-medium px-2 py-0.5 rounded-full",
                        translationHealthy
                          ? "bg-emerald-400/15 text-emerald-300"
                          : "bg-amber-400/15 text-amber-300",
                      )}
                    >
                      {translationHealthy ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      {translationHealthy ? "Active" : "Zero-Key"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-ivory-300">WebRTC STUN/TURN</span>
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1 font-mono text-3xs font-medium px-2 py-0.5 rounded-full",
                        turnHealthy
                          ? "bg-emerald-400/15 text-emerald-300"
                          : "bg-amber-400/15 text-amber-300",
                      )}
                    >
                      {turnHealthy ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      {turnHealthy ? "Active" : "Fallback"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-ivory-300">Neural Indic TTS</span>
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1 font-mono text-3xs font-medium px-2 py-0.5 rounded-full",
                        ttsHealthy
                          ? "bg-emerald-400/15 text-emerald-300"
                          : "bg-amber-400/15 text-amber-300",
                      )}
                    >
                      {ttsHealthy ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      {ttsHealthy ? "Active" : "Zero-Key"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-ivory-300">Database Storage</span>
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1 font-mono text-3xs font-medium px-2 py-0.5 rounded-full",
                        dbHealthy
                          ? "bg-emerald-400/15 text-emerald-300"
                          : "bg-amber-400/15 text-amber-300",
                      )}
                    >
                      {dbHealthy ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      {dbHealthy ? "Connected" : "In-Memory"}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-ink-800/80 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowStatusPopover(false)}
                    className="text-3xs text-ivory-400 hover:text-ivory-200"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Card & Logout Button */}
        <div
          className={clsx(
            "flex items-center rounded-xl border border-ink-700/40 bg-ink-900/30",
            isCollapsed && !isMobile
              ? "flex-col p-2 gap-2"
              : "justify-between p-2.5 gap-2",
          )}
        >
          {/* Avatar and User Name */}
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Avatar
              name={props.user?.name || "User"}
              size={isCollapsed && !isMobile ? "sm" : "md"}
              className="ring-1 ring-ink-700"
            />
            {(!isCollapsed || isMobile) && (
              <div className="truncate text-left">
                <p className="truncate text-xs font-semibold text-ivory-50">
                  {props.user?.name || "Signed In"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge
                    tone={isTeacher ? "accent" : "info"}
                    className="text-3xs px-1.5 py-0 uppercase tracking-wider"
                  >
                    {isTeacher ? "Teacher" : "Student"}
                  </Badge>
                  {props.user?.preferredLanguage && (
                    <span className="font-mono text-3xs text-ivory-400 uppercase">
                      [{props.user.preferredLanguage}]
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Logout Action */}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out of NexClass"
            title="Sign out"
            className={clsx(
              "nc-focus rounded-lg text-ivory-400 transition-colors hover:bg-rose-500/15 hover:text-rose-300 active:scale-95",
              isCollapsed && !isMobile ? "p-1.5" : "p-2",
            )}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* =========================================================================
          1. Desktop Left Sidebar Rail (>= 1024px)
          ========================================================================= */}
      <aside
        aria-label="Sidebar navigation rail"
        className={clsx(
          "nc-glass-sidebar fixed left-0 top-0 bottom-0 z-30 hidden lg:flex flex-col transition-[width] duration-300 ease-[0.2,0.8,0.2,1]",
          isCollapsed ? "w-20" : "w-64",
        )}
      >
        {/* Top Brand & Identity Section */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink-700/60 px-4">
          <Link
            to="/"
            className={clsx(
              "nc-focus flex items-center rounded-xl text-ivory-50 transition-opacity hover:opacity-90",
              isCollapsed ? "justify-center w-full" : "gap-3",
            )}
            title="NexClass Educational Command Center"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-400/15 text-accent-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-display text-base font-bold tracking-tight">NexClass</span>
                <span className="text-3xs text-ivory-400 font-mono tracking-widest uppercase">
                  Command Center
                </span>
              </div>
            )}
          </Link>

          {/* Toggle Rail Collapse Button */}
          {!isCollapsed && (
            <button
              type="button"
              onClick={props.onToggleCollapse}
              aria-label="Collapse sidebar rail"
              title="Collapse sidebar rail (w-20)"
              className="nc-focus grid h-8 w-8 place-items-center rounded-lg border border-ink-700/70 bg-ink-900/60 text-ivory-400 transition-colors hover:border-ink-500 hover:bg-ink-800 hover:text-ivory-100"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Collapsed Rail Expand Button */}
        {isCollapsed && (
          <div className="flex justify-center pt-2 pb-1">
            <button
              type="button"
              onClick={props.onToggleCollapse}
              aria-label="Expand sidebar rail"
              title="Expand sidebar rail (w-64)"
              className="nc-focus grid h-7 w-7 place-items-center rounded-lg border border-ink-700/60 bg-ink-900/40 text-ivory-400 transition-colors hover:border-ink-500 hover:bg-ink-800 hover:text-ivory-100"
            >
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-none">
          {renderNavList(false)}
        </div>

        {/* Footer with Live Beacon & User Profile */}
        {renderFooter(false)}
      </aside>

      {/* =========================================================================
          2. Mobile & Tablet Slide-Over Drawer (< 1024px)
          ========================================================================= */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.24 }}
              onClick={props.onCloseMobile}
              className="fixed inset-0 z-40 bg-ink-950/80 backdrop-blur-md lg:hidden"
              aria-hidden="true"
            />

            {/* Slide-Over Drawer Aside */}
            <motion.aside
              initial={reduced ? { opacity: 1, x: 0 } : { x: "-100%" }}
              animate={{ x: 0 }}
              exit={reduced ? { opacity: 0 } : { x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation"
              className="nc-glass-drawer fixed top-0 bottom-0 left-0 z-50 flex w-[280px] sm:w-[320px] flex-col lg:hidden"
            >
              {/* Drawer Top Header with Close Button */}
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink-700/60 px-5">
                <Link
                  to="/"
                  onClick={props.onCloseMobile}
                  className="nc-focus flex items-center gap-3 rounded-xl text-ivory-50"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-400/15 text-accent-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="flex flex-col">
                    <span className="font-display text-base font-bold tracking-tight">NexClass</span>
                    <span className="text-3xs text-ivory-400 font-mono tracking-widest uppercase">
                      Mobile Drawer
                    </span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={props.onCloseMobile}
                  aria-label="Close navigation drawer"
                  className="nc-focus grid h-9 w-9 place-items-center rounded-xl border border-ink-700/70 bg-ink-900/60 text-ivory-300 transition-colors hover:border-ink-500 hover:bg-ink-800 hover:text-ivory-50"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {/* Mobile Navigation Items */}
              <div className="flex-1 overflow-y-auto py-5 scrollbar-none">
                {renderNavList(true)}
              </div>

              {/* Mobile Footer */}
              {renderFooter(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
