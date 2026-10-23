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
  badge,
  onClick,
  disabled,
  children,
}: {
  label: string;
  active?: boolean;
  danger?: boolean;
  badge?: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion() ?? false;
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { y: 2, scale: 0.99 }}
      whileHover={disabled ? undefined : { y: -1 }}
      transition={{ duration: reduced ? 0 : 0.08 }}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={clsx(
        "nc-focus group relative inline-flex h-10 shrink-0 select-none items-center gap-2 rounded-xl border pl-2 pr-2 sm:pl-2.5 sm:pr-3.5",
        // Physical key look: raised face, darker chunky bottom edge and a top
        // inner highlight that reads as light on the keycap.
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_2px_4px_rgba(0,0,0,0.45)]",
        "transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40",
        danger
          ? "border-signal-live/60 border-b-signal-live/25 bg-gradient-to-b from-ink-750 to-signal-live/12 text-rose-200 hover:border-signal-live/80"
          : active
            ? "border-accent-500/70 border-b-accent-600/50 bg-gradient-to-b from-ink-750 to-accent-400/12 text-accent-100 hover:border-accent-400"
            : "border-ink-600 border-b-ink-950 bg-gradient-to-b from-ink-750 to-ink-900 text-ivory-100 hover:border-ink-500",
      )}
    >
      <span
        className={clsx(
          "grid h-6 w-6 shrink-0 place-items-center rounded-lg transition-colors duration-150",
          danger
            ? "bg-signal-live/15 text-rose-300"
            : active
              ? "bg-accent-400/20 text-accent-200"
              : "bg-ink-600/60 text-ivory-200 group-hover:bg-ink-500/60 group-hover:text-ivory-50",
        )}
      >
        {children}
      </span>
      <span className="hidden whitespace-nowrap text-[12px] font-semibold tracking-tight sm:inline">{label}</span>
      {badge ? (
        <motion.span
          key={badge}
          initial={reduced ? { scale: 1 } : { scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ duration: reduced ? 0 : 0.18, type: "spring", stiffness: 400, damping: 22 }}
          className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full border border-ink-900 bg-signal-live px-1 font-mono text-[9px] font-bold text-white"
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
 * The meeting toolbar.
 *
 * On phones this is an icon-only horizontally scrollable row; on desktop every
 * control shows its label next to the icon.
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
    <div className="sticky bottom-0 z-30 border-t border-ink-700/70 bg-ink-900/90 px-2.5 py-2 backdrop-blur-xl sm:px-4">
      <div
        className="flex items-center justify-center gap-1.5 overflow-x-auto scrollbar-none"
        role="toolbar"
        aria-label="Meeting controls"
      >
        <IconButton
          label={audioEnabled ? "Mute microphone" : "Unmute microphone"}
          active={audioEnabled}
          onClick={onToggleAudio}
          disabled={disabled}
        >
          {audioEnabled ? (
            <Mic className="h-4 w-4" aria-hidden="true" />
          ) : (
            <MicOff className="h-4 w-4" aria-hidden="true" />
          )}
        </IconButton>

        <IconButton
          label={videoEnabled ? "Turn camera off" : "Turn camera on"}
          active={videoEnabled}
          onClick={onToggleVideo}
          disabled={disabled}
        >
          {videoEnabled ? (
            <Video className="h-4 w-4" aria-hidden="true" />
          ) : (
            <VideoOff className="h-4 w-4" aria-hidden="true" />
          )}
        </IconButton>

        <IconButton
          label={screenSharing ? "Stop screen share" : "Share screen"}
          active={screenSharing}
          onClick={onToggleShare}
          disabled={disabled}
        >
          <MonitorUp className="h-4 w-4" aria-hidden="true" />
        </IconButton>

        <span className="mx-0.5 hidden h-6 w-px shrink-0 bg-ink-600 sm:block" aria-hidden="true" />

        <IconButton label="Participants" active={false} onClick={() => onOpenPanel("participants")}>
          <Users className="h-4 w-4" aria-hidden="true" />
        </IconButton>

        <IconButton
          label={`Chat${unreadChat > 0 ? `, ${unreadChat} unread` : ""}`}
          active={false}
          badge={unreadChat > 0 ? String(unreadChat) : undefined}
          onClick={() => onOpenPanel("chat")}
        >
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
        </IconButton>

        <IconButton
          label={captionsVisible ? "Hide captions" : "Show captions"}
          active={captionsVisible}
          onClick={onToggleCaptions}
        >
          {captionsVisible ? (
            <Captions className="h-4 w-4" aria-hidden="true" />
          ) : (
            <CaptionsOff className="h-4 w-4" aria-hidden="true" />
          )}
        </IconButton>

        <IconButton label="Settings" active={false} onClick={() => onOpenPanel("settings")}>
          <Settings className="h-4 w-4" aria-hidden="true" />
        </IconButton>

        <span className="mx-0.5 hidden h-6 w-px shrink-0 bg-ink-600 sm:block" aria-hidden="true" />

        <IconButton
          label="Leave class"
          danger
          onClick={onLeave}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </IconButton>

        {isHost ? (
          <IconButton
            label="End meeting"
            danger
            onClick={onEndMeeting}
          >
            <Square className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        ) : null}
      </div>
    </div>
  );
}
