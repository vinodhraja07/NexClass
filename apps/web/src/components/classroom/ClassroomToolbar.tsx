import { motion, useReducedMotion } from "motion/react";
import {
  Captions,
  CaptionsOff,
  LogOut,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  Settings,
  Square,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import clsx from "clsx";

function IconButton({
  label,
  active,
  danger,
  mutedWarning,
  badge,
  onClick,
  disabled,
  children,
}: {
  label: string;
  active?: boolean;
  danger?: boolean;
  mutedWarning?: boolean;
  badge?: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion() ?? false;
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.96, y: 1 }}
      whileHover={disabled ? undefined : { y: -1 }}
      transition={{ duration: reduced ? 0 : 0.12, ease: "easeOut" }}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={clsx(
        "nc-focus group relative inline-flex h-10 shrink-0 select-none items-center gap-2 rounded-xl border px-2.5 sm:px-3 text-xs font-semibold transition-all duration-200",
        "shadow-xs disabled:pointer-events-none disabled:opacity-40",
        danger
          ? "border-signal-live/60 bg-signal-live/15 text-rose-200 hover:bg-signal-live/25 hover:border-signal-live active:bg-signal-live/30"
          : mutedWarning
            ? "border-signal-live/40 bg-surface/80 text-rose-300 hover:bg-signal-live/10 hover:border-signal-live/70"
            : active
              ? "border-primary/60 bg-primary/15 text-primary hover:bg-primary/20 hover:border-primary shadow-xs shadow-primary/20"
              : "border-border/70 bg-surface/70 text-text-primary hover:bg-surface hover:border-border hover:text-text-primary",
      )}
    >
      <span
        className={clsx(
          "grid h-6 w-6 shrink-0 place-items-center rounded-lg transition-colors duration-150",
          danger
            ? "bg-signal-live/20 text-rose-300"
            : mutedWarning
              ? "bg-signal-live/15 text-rose-300"
              : active
                ? "bg-primary/20 text-primary"
                : "bg-muted/60 text-text-secondary group-hover:text-text-primary",
        )}
      >
        {children}
      </span>
      <span className="hidden whitespace-nowrap lg:inline text-[12px]">{label}</span>

      {badge ? (
        <motion.span
          key={badge}
          initial={reduced ? { scale: 1 } : { scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ duration: reduced ? 0 : 0.18, type: "spring", stiffness: 400, damping: 22 }}
          className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full border border-background bg-signal-live px-1 font-mono text-[9px] font-bold text-white shadow-xs"
        >
          {badge}
        </motion.span>
      ) : null}
    </motion.button>
  );
}

export interface ClassroomToolbarProps {
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  captionsVisible: boolean;
  unreadChat: number;
  isHost: boolean;
  disabled?: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleShare: () => void;
  onToggleCaptions: () => void;
  onOpenPanel: (tab: "participants" | "chat" | "settings") => void;
  onLeave: () => void;
  onEndMeeting: () => void;
}

/**
 * Premium Apple/Linear-inspired Classroom Toolbar.
 */
export function ClassroomToolbar({
  audioEnabled,
  videoEnabled,
  screenSharing,
  captionsVisible,
  unreadChat,
  isHost,
  disabled = false,
  onToggleAudio,
  onToggleVideo,
  onToggleShare,
  onToggleCaptions,
  onOpenPanel,
  onLeave,
  onEndMeeting,
}: ClassroomToolbarProps) {
  return (
    <div className="sticky bottom-0 z-30 border-t border-border/80 bg-background/90 px-3 py-2.5 backdrop-blur-2xl sm:px-4">
      <div
        className="mx-auto flex max-w-6xl items-center justify-between gap-2 overflow-x-auto scrollbar-none"
        role="toolbar"
        aria-label="Meeting controls"
      >
        {/* Group 1: Media Device Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <IconButton
            label={audioEnabled ? "Mute" : "Unmute"}
            active={audioEnabled}
            mutedWarning={!audioEnabled}
            onClick={onToggleAudio}
            disabled={disabled}
          >
            {audioEnabled ? (
              <Mic className="h-4 w-4 text-primary" aria-hidden="true" />
            ) : (
              <MicOff className="h-4 w-4 text-rose-300" aria-hidden="true" />
            )}
          </IconButton>

          <IconButton
            label={videoEnabled ? "Stop Video" : "Start Video"}
            active={videoEnabled}
            mutedWarning={!videoEnabled}
            onClick={onToggleVideo}
            disabled={disabled}
          >
            {videoEnabled ? (
              <Video className="h-4 w-4 text-primary" aria-hidden="true" />
            ) : (
              <VideoOff className="h-4 w-4 text-rose-300" aria-hidden="true" />
            )}
          </IconButton>

          <IconButton
            label={screenSharing ? "Stop Sharing" : "Share Screen"}
            active={screenSharing}
            onClick={onToggleShare}
            disabled={disabled}
          >
            <MonitorUp className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        </div>

        {/* Group 2: Collaboration & Navigation Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <IconButton
            label="People"
            active={false}
            onClick={() => onOpenPanel("participants")}
          >
            <Users className="h-4 w-4" aria-hidden="true" />
          </IconButton>

          <IconButton
            label={`Chat${unreadChat > 0 ? ` (${unreadChat})` : ""}`}
            active={false}
            badge={unreadChat > 0 ? String(unreadChat) : undefined}
            onClick={() => onOpenPanel("chat")}
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
          </IconButton>

          <IconButton
            label={captionsVisible ? "Captions ON" : "Captions OFF"}
            active={captionsVisible}
            onClick={onToggleCaptions}
          >
            {captionsVisible ? (
              <Captions className="h-4 w-4 text-primary" aria-hidden="true" />
            ) : (
              <CaptionsOff className="h-4 w-4 text-text-secondary" aria-hidden="true" />
            )}
          </IconButton>

          <IconButton
            label="Settings"
            active={false}
            onClick={() => onOpenPanel("settings")}
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        </div>

        {/* Group 3: Exit Session Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <IconButton
            label="Leave"
            danger
            onClick={onLeave}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </IconButton>

          {isHost && (
            <IconButton
              label="End Class"
              danger
              onClick={onEndMeeting}
            >
              <Square className="h-4 w-4" aria-hidden="true" />
            </IconButton>
          )}
        </div>
      </div>
    </div>
  );
}
