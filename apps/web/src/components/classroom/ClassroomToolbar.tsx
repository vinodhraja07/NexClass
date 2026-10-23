import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Captions,
  Check,
  Copy,
  Hand,
  Headphones,
  Info,
  Languages,
  LogOut,
  MessageSquare,
  Mic,
  MicOff,
  MonitorOff,
  MonitorUp,
  PhoneOff,
  Square,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import clsx from "clsx";
import type { MeetTab } from "./MeetSidePanel";
import type { VoiceMode } from "@/hooks/useVoicePlayback";

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
  onOpenPanel: (tab: MeetTab) => void;
  activePanelTab?: MeetTab | null;
  panelOpen?: boolean;
  onLeave: () => void;
  onEndMeeting: () => void;
  meetingCode?: string;
  participantCount?: number;
  voiceMode?: VoiceMode;
  onToggleVoiceMode?: () => void;
}

/**
 * Isolated Meeting Clock to prevent re-rendering the full toolbar every second.
 */
function MeetingClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true }),
      );
    };
    update();
    const interval = window.setInterval(update, 10000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <span className="hidden md:inline font-mono text-sm font-medium text-text-primary/90">
      {time || "12:00 PM"}
    </span>
  );
}

/**
 * Authentic Google Meet Circular Bottom Toolbar.
 *
 * Implements the 3-zone Google Meet layout:
 * - Left: Meeting Time & Clickable Room Code
 * - Center: Responsive Circular Media Buttons & Red Leave Pill
 * - Right: Circular Drawer Triggers (Info, People with count, Chat with badge, Language Hub)
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
  activePanelTab,
  panelOpen = false,
  onLeave,
  onEndMeeting,
  meetingCode = "NEXCLASS",
  participantCount = 1,
  voiceMode = "translated",
  onToggleVoiceMode,
}: ClassroomToolbarProps) {
  const reduced = useReducedMotion() ?? false;
  const [handRaised, setHandRaised] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const copyCode = () => {
    try {
      void navigator.clipboard?.writeText(meetingCode);
      setCodeCopied(true);
      window.setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative z-30 flex h-[72px] sm:h-[76px] w-full shrink-0 items-center justify-between border-t border-border/80 bg-background/95 px-2 sm:px-6 backdrop-blur-2xl">
      {/* Zone 1 (Left): Time & Room Code */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 max-w-xs">
        <MeetingClock />
        <span className="hidden md:inline text-border select-none">|</span>
        <button
          type="button"
          onClick={copyCode}
          className="nc-focus group flex items-center gap-1.5 rounded-lg border border-transparent px-1.5 sm:px-2 py-1 text-xs font-semibold text-text-secondary hover:border-border hover:bg-surface hover:text-text-primary transition-all truncate"
          title="Click to copy meeting code"
        >
          <span className="font-mono tracking-wide truncate max-w-[80px] sm:max-w-none">
            {meetingCode.toLowerCase()}
          </span>
          {codeCopied ? (
            <Check className="h-3.5 w-3.5 text-primary shrink-0" />
          ) : (
            <Copy className="h-3 w-3 opacity-60 group-hover:opacity-100 shrink-0" />
          )}
        </button>
      </div>

      {/* Zone 2 (Center): Circular Media Controls + Red Leave Pill */}
      <div
        className="flex items-center gap-1.5 sm:gap-3 shrink-0"
        role="toolbar"
        aria-label="Google Meet call controls"
      >
        {/* Microphone Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: reduced ? 0 : 0.12 }}
          onClick={onToggleAudio}
          disabled={disabled}
          title={audioEnabled ? "Turn off microphone (m)" : "Turn on microphone (m)"}
          aria-label={audioEnabled ? "Mute microphone" : "Unmute microphone"}
          aria-pressed={audioEnabled}
          className={clsx(
            "nc-focus grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-full transition-all shadow-md select-none",
            audioEnabled
              ? "bg-surface/90 text-text-primary border border-border/80 hover:bg-surface hover:border-primary/50"
              : "bg-rose-600 text-white shadow-rose-600/30 hover:bg-rose-700",
          )}
        >
          {audioEnabled ? (
            <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </motion.button>

        {/* Camera Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: reduced ? 0 : 0.12 }}
          onClick={onToggleVideo}
          disabled={disabled}
          title={videoEnabled ? "Turn off camera (v)" : "Turn on camera (v)"}
          aria-label={videoEnabled ? "Stop video" : "Start video"}
          aria-pressed={videoEnabled}
          className={clsx(
            "nc-focus grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-full transition-all shadow-md select-none",
            videoEnabled
              ? "bg-surface/90 text-text-primary border border-border/80 hover:bg-surface hover:border-primary/50"
              : "bg-rose-600 text-white shadow-rose-600/30 hover:bg-rose-700",
          )}
        >
          {videoEnabled ? (
            <Video className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <VideoOff className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </motion.button>

        {/* Closed Captions (CC) */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: reduced ? 0 : 0.12 }}
          onClick={onToggleCaptions}
          title={captionsVisible ? "Turn off captions (c)" : "Turn on captions (c)"}
          aria-label="Toggle subtitles"
          aria-pressed={captionsVisible}
          className={clsx(
            "nc-focus grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-full transition-all shadow-md select-none",
            captionsVisible
              ? "bg-primary text-background font-bold shadow-primary/25 hover:bg-primary/90"
              : "bg-surface/90 text-text-secondary border border-border/80 hover:bg-surface hover:text-text-primary",
          )}
        >
          <Captions className="h-4 w-4 sm:h-5 sm:w-5" />
        </motion.button>

        {/* Quick Language / Voice Mode Toggle */}
        {onToggleVoiceMode && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: reduced ? 0 : 0.12 }}
            onClick={onToggleVoiceMode}
            title={
              voiceMode === "translated"
                ? "Audio Mode: Translated Voice (Click to switch to Original)"
                : "Audio Mode: Original Audio (Click to switch to Translated Voice)"
            }
            aria-label="Toggle audio voice mode"
            className={clsx(
              "nc-focus relative grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-full transition-all shadow-md select-none",
              voiceMode === "translated"
                ? "bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30"
                : "bg-surface/90 text-text-secondary border border-border/80 hover:bg-surface hover:text-text-primary",
            )}
          >
            <Headphones className="h-4 w-4 sm:h-5 sm:w-5" />
            {voiceMode === "translated" && (
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-emerald-400 ring-2 ring-background" />
            )}
          </motion.button>
        )}

        {/* Screen Share (Hidden on small mobile) */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: reduced ? 0 : 0.12 }}
          onClick={onToggleShare}
          disabled={disabled}
          title={screenSharing ? "Stop presenting" : "Present now (Screen Share)"}
          aria-label="Present screen"
          aria-pressed={screenSharing}
          className={clsx(
            "nc-focus hidden sm:grid h-12 w-12 place-items-center rounded-full transition-all shadow-md select-none",
            screenSharing
              ? "bg-primary text-background font-bold shadow-primary/25"
              : "bg-surface/90 text-text-secondary border border-border/80 hover:bg-surface hover:text-text-primary",
          )}
        >
          {screenSharing ? <MonitorOff className="h-5 w-5" /> : <MonitorUp className="h-5 w-5" />}
        </motion.button>

        {/* Raise Hand Reaction (Hidden on small mobile) */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: reduced ? 0 : 0.12 }}
          onClick={() => setHandRaised(!handRaised)}
          title={handRaised ? "Lower hand" : "Raise hand"}
          aria-label="Raise hand"
          aria-pressed={handRaised}
          className={clsx(
            "nc-focus hidden sm:grid h-12 w-12 place-items-center rounded-full transition-all shadow-md select-none",
            handRaised
              ? "bg-amber-500 text-background font-bold shadow-amber-500/30"
              : "bg-surface/90 text-text-secondary border border-border/80 hover:bg-surface hover:text-text-primary",
          )}
        >
          <Hand className="h-5 w-5" />
        </motion.button>

        {/* Red Leave Call Pill Button */}
        <div className="flex items-center gap-1 sm:gap-1.5 ml-0.5 sm:ml-1">
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: reduced ? 0 : 0.12 }}
            onClick={onLeave}
            title="Leave call"
            aria-label="Leave meeting"
            className="nc-focus inline-flex h-10 sm:h-12 items-center gap-1.5 sm:gap-2 rounded-full bg-rose-600 px-3.5 sm:px-5 text-xs font-semibold text-white shadow-lg shadow-rose-600/25 hover:bg-rose-700 active:bg-rose-800 transition-all select-none"
          >
            <PhoneOff className="h-4 w-4" />
            <span className="hidden xs:inline">Leave</span>
          </motion.button>

          {isHost && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: reduced ? 0 : 0.12 }}
              onClick={onEndMeeting}
              title="End class for everyone"
              aria-label="End meeting"
              className="nc-focus hidden md:grid h-12 w-12 place-items-center rounded-full bg-rose-950/70 border border-rose-500/50 text-rose-300 hover:bg-rose-900 transition-all"
            >
              <Square className="h-4 w-4" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Zone 3 (Right): Side Panel Toggles */}
      <div className="flex items-center gap-1 sm:gap-2 justify-end min-w-0 flex-1 max-w-xs">
        {/* Details / Info Trigger */}
        <button
          type="button"
          onClick={() => onOpenPanel("info")}
          title="Meeting details"
          aria-label="Meeting information"
          className={clsx(
            "nc-focus grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full transition-all select-none",
            panelOpen && activePanelTab === "info"
              ? "bg-primary text-background font-bold shadow-sm"
              : "text-text-secondary hover:bg-surface hover:text-text-primary",
          )}
        >
          <Info className="h-4 w-4" />
        </button>

        {/* People Trigger */}
        <button
          type="button"
          onClick={() => onOpenPanel("people")}
          title="People"
          aria-label={`Participants (${participantCount})`}
          className={clsx(
            "nc-focus relative grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full transition-all select-none",
            panelOpen && activePanelTab === "people"
              ? "bg-primary text-background font-bold shadow-sm"
              : "text-text-secondary hover:bg-surface hover:text-text-primary",
          )}
        >
          <Users className="h-4 w-4" />
          {participantCount > 0 && (
            <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-surface border border-border px-1 font-mono text-[9px] font-bold text-text-primary">
              {participantCount}
            </span>
          )}
        </button>

        {/* Chat Trigger */}
        <button
          type="button"
          onClick={() => onOpenPanel("chat")}
          title="In-call messages"
          aria-label="In-call chat"
          className={clsx(
            "nc-focus relative grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full transition-all select-none",
            panelOpen && activePanelTab === "chat"
              ? "bg-primary text-background font-bold shadow-sm"
              : "text-text-secondary hover:bg-surface hover:text-text-primary",
          )}
        >
          <MessageSquare className="h-4 w-4" />
          {unreadChat > 0 && (
            <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-signal-live px-1 font-mono text-[9px] font-bold text-white shadow-sm">
              {unreadChat}
            </span>
          )}
        </button>

        {/* Language & Speech Hub Trigger */}
        <button
          type="button"
          onClick={() => onOpenPanel("language")}
          title="Language & Audio Hub"
          aria-label="Language and speech settings"
          className={clsx(
            "nc-focus relative grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full transition-all select-none",
            panelOpen && activePanelTab === "language"
              ? "bg-primary text-background font-bold shadow-sm"
              : "text-text-secondary hover:bg-surface hover:text-text-primary",
          )}
        >
          <Languages className="h-4 w-4" />
          {voiceMode === "translated" && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary" />
          )}
        </button>
      </div>
    </div>
  );
}
