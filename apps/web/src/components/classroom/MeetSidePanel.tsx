import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Check,
  CircleDot,
  Copy,
  Download,
  Film,
  Info,
  Languages,
  MessageSquare,
  Play,
  RefreshCw,
  ShieldAlert,
  Square,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { ParticipantsPanel, type ParticipantsPanelProps } from "./ParticipantsPanel";
import { ChatPanel, type ChatPanelProps } from "./ChatPanel";
import { LanguageHubPanel, type LanguageHubPanelProps } from "./LanguageHubPanel";
import type { ConnectionStatus, ProviderRuntimeStatus } from "@/lib/transport";
import type { MeetingPublic } from "@nexclass/shared";
import { type RecordingPublic, formatRecordingDuration } from "@/hooks/useMeetingRecording";

export type MeetTab = "people" | "chat" | "language" | "info";

export interface RecordingsPanelProps {
  recordings: RecordingPublic[];
  loading: boolean;
  onRefresh: () => void;
  isRecording?: boolean;
  recordingElapsed?: number;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  isHost?: boolean;
}

export interface MeetSidePanelProps {
  open: boolean;
  activeTab: MeetTab;
  onTabChange: (tab: MeetTab) => void;
  onClose: () => void;
  unreadChat: number;
  participantsProps: ParticipantsPanelProps;
  chatProps: ChatPanelProps;
  languageHubProps: LanguageHubPanelProps;
  recordingsProps?: RecordingsPanelProps;
  meetingInfo: {
    meeting: MeetingPublic | null;
    meetingCode: string;
    isHost: boolean;
    status: ConnectionStatus;
    providerStatus: ProviderRuntimeStatus | null;
  };
}

const TAB_CONFIG: { id: MeetTab; label: string; icon: typeof Users }[] = [
  { id: "people", label: "People", icon: Users },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "language", label: "Languages", icon: Languages },
  { id: "info", label: "Details", icon: Info },
];

/**
 * Google Meet 360px Sliding Right Drawer.
 *
 * Proportionally resizes the video stage and hosts People, In-call chat,
 * Multilingual speech hub, and Meeting details with Apple-grade polish.
 */
export function MeetSidePanel({
  open,
  activeTab,
  onTabChange,
  onClose,
  unreadChat,
  participantsProps,
  chatProps,
  languageHubProps,
  recordingsProps,
  meetingInfo,
}: MeetSidePanelProps) {
  const reduced = useReducedMotion() ?? false;
  const [copied, setCopied] = useState(false);

  const copyMeetingLink = () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      void navigator.clipboard?.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (!open) return null;

  return (
    <motion.aside
      key="meet-side-panel"
      initial={reduced ? { opacity: 0 } : { x: 360, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={reduced ? { opacity: 0 } : { x: 360, opacity: 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className="fixed inset-y-0 right-0 z-40 flex h-full w-full sm:w-[360px] sm:relative sm:z-20 shrink-0 flex-col overflow-hidden rounded-none sm:rounded-2xl border-l sm:border border-border/80 bg-surface/95 shadow-2xl backdrop-blur-2xl"
      aria-label="Meeting side panel"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-surface/90 px-4 py-3">
        <h2 className="text-sm font-semibold text-text-primary capitalize">
          {activeTab === "people"
            ? `People (${participantsProps.participants.length})`
            : activeTab === "chat"
              ? "In-call messages"
              : activeTab === "language"
                ? "Language & Speech Hub"
                : "Meeting details"}
        </h2>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close side panel"
            className="nc-focus grid h-8 w-8 place-items-center rounded-xl text-text-secondary hover:bg-muted hover:text-text-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Meet-Style Top Tab Pill Navigation */}
      <div className="flex items-center gap-1 border-b border-border/40 bg-background/40 p-1.5">
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                "nc-focus relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold transition-all",
                isActive
                  ? "bg-primary text-background shadow-sm font-bold"
                  : "text-text-secondary hover:bg-surface hover:text-text-primary",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {tab.id === "chat" && unreadChat > 0 && (
                <span className="grid h-4 min-w-4 place-items-center rounded-full bg-signal-live px-1 font-mono text-[9px] font-bold text-white">
                  {unreadChat}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "people" && <ParticipantsPanel {...participantsProps} />}
        {activeTab === "chat" && <ChatPanel {...chatProps} />}
        {activeTab === "language" && <LanguageHubPanel {...languageHubProps} />}
        {activeTab === "info" && (
          <div className="flex h-full flex-col overflow-y-auto p-4 space-y-4 text-xs text-text-primary">
            <div>
              <p className="font-bold text-xs uppercase tracking-wider text-text-secondary mb-1">
                Joining Info
              </p>
              <p className="text-2xs text-text-secondary mb-2">
                Share this link or code with students to join your multilingual classroom.
              </p>
              <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/60 p-2.5">
                <span className="flex-1 font-mono font-semibold text-primary truncate select-all">
                  {meetingInfo.meetingCode}
                </span>
                <button
                  type="button"
                  onClick={copyMeetingLink}
                  className="nc-focus flex items-center gap-1 rounded-lg bg-primary/15 border border-primary/30 px-2 py-1 text-2xs font-semibold text-primary hover:bg-primary/25 transition-colors"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Classroom Recordings Section */}
            <div className="rounded-xl border border-border/60 bg-background/40 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Film className="h-4 w-4 text-primary" />
                  <p className="font-bold text-2xs uppercase tracking-wider text-text-secondary">
                    Classroom Recordings
                  </p>
                </div>
                {recordingsProps?.onRefresh && (
                  <button
                    type="button"
                    onClick={recordingsProps.onRefresh}
                    disabled={recordingsProps.loading}
                    title="Refresh recordings list"
                    className="nc-focus grid h-6 w-6 place-items-center rounded text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
                  >
                    <RefreshCw className={clsx("h-3 w-3", recordingsProps.loading && "animate-spin")} />
                  </button>
                )}
              </div>

              {/* Realtime Status Indicator */}
              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-surface/60 px-2.5 py-1.5 text-2xs">
                <span className="text-text-secondary">Status</span>
                {recordingsProps?.isRecording ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-rose-400">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    Recording ({formatRecordingDuration(recordingsProps.recordingElapsed ?? 0)})
                  </span>
                ) : (
                  <span className="text-text-secondary font-medium">Idle</span>
                )}
              </div>

              {/* Host Quick Control */}
              {recordingsProps?.isHost && (
                <button
                  type="button"
                  onClick={
                    recordingsProps.isRecording
                      ? recordingsProps.onStopRecording
                      : recordingsProps.onStartRecording
                  }
                  className={clsx(
                    "nc-focus flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-2xs font-semibold transition-all shadow-sm",
                    recordingsProps.isRecording
                      ? "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/25"
                      : "bg-surface hover:bg-surface/80 border border-border text-text-primary",
                  )}
                >
                  {recordingsProps.isRecording ? (
                    <>
                      <Square className="h-3 w-3 fill-current" /> Stop Recording
                    </>
                  ) : (
                    <>
                      <CircleDot className="h-3 w-3 text-rose-500" /> Start Recording
                    </>
                  )}
                </button>
              )}

              {/* Saved Sessions */}
              <div className="space-y-2">
                <p className="font-semibold text-[11px] text-text-secondary">
                  Saved Sessions ({recordingsProps?.recordings.length ?? 0})
                </p>

                {!recordingsProps?.recordings || recordingsProps.recordings.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 p-3 text-center">
                    <p className="text-2xs text-text-secondary">
                      No recordings saved yet. When a recording ends, it will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                    {recordingsProps.recordings.map((rec) => {
                      const sizeMb = (rec.sizeBytes / (1024 * 1024)).toFixed(1);
                      const durFormatted = formatRecordingDuration(rec.durationSeconds);
                      const dateStr = rec.createdAt
                        ? new Date(rec.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Just now";

                      return (
                        <div
                          key={rec.id}
                          className="flex flex-col gap-1.5 rounded-lg border border-border/70 bg-surface/80 p-2 text-2xs transition-colors hover:border-primary/40"
                        >
                          <div className="flex items-center justify-between min-w-0">
                            <span
                              className="font-medium text-text-primary truncate max-w-[170px]"
                              title={rec.fileName}
                            >
                              {rec.fileName}
                            </span>
                            <span className="font-mono text-[10px] text-text-secondary shrink-0">
                              {durFormatted}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-text-secondary">
                            <span>
                              {dateStr} • {sizeMb} MB
                            </span>
                            <div className="flex items-center gap-1">
                              <a
                                href={rec.streamUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Stream playback"
                                className="nc-focus inline-flex items-center gap-1 rounded bg-surface px-1.5 py-0.5 font-medium text-primary hover:bg-primary/10 transition-colors"
                              >
                                <Play className="h-2.5 w-2.5" /> Stream
                              </a>
                              <a
                                href={rec.downloadUrl}
                                download
                                title="Download .webm"
                                className="nc-focus inline-flex items-center gap-1 rounded bg-surface px-1.5 py-0.5 font-medium text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                              >
                                <Download className="h-2.5 w-2.5" /> Download
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/40 p-3 space-y-2">
              <p className="font-bold text-2xs uppercase tracking-wider text-text-secondary">
                Classroom Status
              </p>
              <div className="flex items-center justify-between text-2xs">
                <span className="text-text-secondary">Connection</span>
                <span className="font-semibold text-emerald-400 capitalize">
                  {meetingInfo.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-2xs">
                <span className="text-text-secondary">Your Role</span>
                <span className="font-semibold text-primary">
                  {meetingInfo.isHost ? "Teacher (Host)" : "Student"}
                </span>
              </div>
              <div className="flex items-center justify-between text-2xs">
                <span className="text-text-secondary">Total Learners</span>
                <span className="font-semibold text-text-primary">
                  {participantsProps.participants.length}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/40 p-3 space-y-1.5">
              <p className="font-bold text-2xs uppercase tracking-wider text-text-secondary">
                Keyboard Shortcuts
              </p>
              <div className="flex items-center justify-between text-2xs">
                <span className="text-text-secondary">Mute / Unmute Mic</span>
                <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">
                  M
                </kbd>
              </div>
              <div className="flex items-center justify-between text-2xs">
                <span className="text-text-secondary">Camera On / Off</span>
                <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">
                  V
                </kbd>
              </div>
              <div className="flex items-center justify-between text-2xs">
                <span className="text-text-secondary">Subtitles / Captions</span>
                <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">
                  C
                </kbd>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
