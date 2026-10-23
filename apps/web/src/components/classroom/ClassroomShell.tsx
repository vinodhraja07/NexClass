import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CircleAlert, Disc, RefreshCw, X } from "lucide-react";
import clsx from "clsx";
import type { MeetingTransport } from "@/lib/transport";
import { api } from "@/lib/api";
import { useClassroom } from "@/hooks/useClassroom";
import { usePeerConnections } from "@/hooks/usePeerConnections";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useVoicePlayback } from "@/hooks/useVoicePlayback";
import { useClassroomPreferences } from "@/hooks/useClassroomPreferences";
import { useMeetingRecording } from "@/hooks/useMeetingRecording";
import type { LanguageCode } from "@nexclass/shared";
import type { TileStatus } from "./VideoTile";
import { ClassroomHeader } from "./ClassroomHeader";
import { ClassroomToolbar } from "./ClassroomToolbar";
import { Stage } from "./Stage";
import { CaptionOverlay } from "./CaptionOverlay";
import { MeetSidePanel, type MeetTab } from "./MeetSidePanel";

export interface ClassroomShellProps {
  transport: MeetingTransport;
  /** Demo chrome: badges and clarifying labels without changing behaviour. */
  simulated?: boolean;
  /** Which class code / name this session should join with. */
  meetingCode: string;
  name?: string;
  language?: LanguageCode;
  /** False while a demo lecture is paused - flushes the translated voice. */
  voiceActive?: boolean;
  /** Called after the participant left the room. */
  onLeft?: () => void;
}

interface Toast {
  id: number;
  text: string;
  tone: "neutral" | "warn";
}

/**
 * Google Meet-Style Multilingual Classroom Shell.
 *
 * Implements full-viewport video immersion, floating translucent subtitle
 * overlay, iconic 3-zone circular bottom toolbar, and 360px sliding side panel.
 */
export function ClassroomShell({
  transport,
  simulated = false,
  meetingCode,
  name,
  language,
  voiceActive,
  onLeft,
}: ClassroomShellProps) {
  const reduced = useReducedMotion() ?? false;

  const joinContext = useMemo(
    () => ({ meetingCode, name, language }),
    [meetingCode, name, language],
  );
  const classroom = useClassroom(transport, null, null, joinContext);
  const prefs = useClassroomPreferences();

  const [activeTab, setActiveTab] = useState<MeetTab>("people");
  const [panelOpen, setPanelOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const [showQuickGuide, setShowQuickGuide] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("nexclass_dismiss_guide") !== "true";
  });

  const dismissQuickGuide = () => {
    setShowQuickGuide(false);
    try {
      localStorage.setItem("nexclass_dismiss_guide", "true");
    } catch {
      /* ignore storage errors */
    }
  };

  const pushToast = useCallback((text: string, tone: Toast["tone"] = "neutral") => {
    toastIdRef.current += 1;
    const id = toastIdRef.current;
    setToasts((current) => [...current.slice(-2), { id, text, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  const meetingRef = useRef(classroom.meeting);
  useEffect(() => {
    meetingRef.current = classroom.meeting;
  }, [classroom.meeting]);

  const peers = usePeerConnections({
    transport,
    selfId: classroom.self?.id ?? null,
    localStream: classroom.localStream,
    remoteIds: classroom.participants
      .filter((participant) => !participant.isSimulated)
      .map((participant) => participant.id),
    providerStatus: classroom.providerStatus,
  });

  const speakerLanguage: LanguageCode = classroom.meeting?.speakerLanguage ?? language ?? "en";
  const canPushCaptions = Boolean(
    classroom.isHost && transport.kind === "live" && classroom.meeting?.status === "live",
  );

  const recognition = useSpeechRecognition({
    language: speakerLanguage,
    enabled: canPushCaptions,
    onInterim: useCallback(
      (text: string) => {
        transport.emit("caption:interim", {
          text,
          language: meetingRef.current?.speakerLanguage ?? language ?? "en",
        });
      },
      [transport, language],
    ),
    onFinal: useCallback(
      (text: string, startTime: number, endTime: number) => {
        transport.emit("caption:original", {
          text,
          language: meetingRef.current?.speakerLanguage ?? language ?? "en",
          startTime,
          endTime,
        });
      },
      [transport, language],
    ),
  });

  const isOriginalAudioMode =
    prefs.preferences.voiceMode === "original" ||
    prefs.preferences.voiceMode === "original-captions";

  // In simulated / demo mode, or when in original mode without live peer audio tracks,
  // the speaker's original language (e.g. "en") is played by useVoicePlayback.
  // In translated mode, the student's chosen translation language is played.
  const activeVoiceLanguage: LanguageCode = isOriginalAudioMode
    ? speakerLanguage
    : classroom.voiceLanguage;

  const hasRemoteAudioTracks = Object.values(peers.peers).some(
    (p) => p.stream && p.stream.getAudioTracks().length > 0,
  );

  const isVoiceEnabled =
    prefs.preferences.voiceMode === "translated" ||
    simulated ||
    transport.kind === "demo" ||
    (isOriginalAudioMode && !hasRemoteAudioTracks);

  const voice = useVoicePlayback({
    segments: classroom.segments,
    voiceLanguage: activeVoiceLanguage,
    voiceMode: prefs.preferences.voiceMode,
    enabled: isVoiceEnabled,
    muted: prefs.preferences.voiceMuted,
    volume: prefs.preferences.voiceVolume,
    active: voiceActive ?? true,
  });

  // Ask for camera and microphone on room join
  const askedMediaRef = useRef(false);
  useEffect(() => {
    if (transport.kind !== "live") return;
    if (classroom.status !== "connected") return;
    if (askedMediaRef.current) return;
    askedMediaRef.current = true;
    void classroom.requestMedia();
  }, [transport.kind, classroom.status]);

  // Clear unread chat when chat tab is visible
  useEffect(() => {
    if (panelOpen && activeTab === "chat") classroom.markChatRead();
  }, [activeTab, panelOpen, classroom.unreadChat]);

  // Keyboard shortcuts: m mic, v camera, c captions
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName.toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable) {
          return;
        }
      }
      const key = event.key.toLowerCase();
      if (key === "m") classroom.toggleAudio();
      if (key === "v") classroom.toggleVideo();
      if (key === "c") prefs.toggleCaptionsVisible();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prefs, classroom]);

  const handleLeave = useCallback(() => {
    classroom.leave();
    onLeft?.();
  }, [classroom, onLeft]);

  const handleEndMeeting = useCallback(async () => {
    setEnding(true);
    if (transport.kind === "live" && classroom.meeting?.code) {
      try {
        await api.endMeeting(classroom.meeting.code);
        pushToast("The class was ended for everyone.");
      } catch (error) {
        pushToast(
          error instanceof Error ? error.message : "The meeting could not be ended.",
          "warn",
        );
      } finally {
        setEnding(false);
      }
      handleLeave();
      return;
    }
    setEnding(false);
    pushToast("Simulated: in a live class this ends the room for everyone.", "warn");
    classroom.leave();
    onLeft?.();
  }, [classroom, handleLeave, onLeft, pushToast, transport.kind]);

  const streams = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(peers.peers).map(([id, entry]) => [id, entry.stream]),
      ),
    [peers.peers],
  );
  const statuses = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(peers.peers).map(([id, entry]) => [id, entry.status as TileStatus]),
      ),
    [peers.peers],
  );

  const availableLanguages = classroom.meeting?.availableLanguages ?? [];

  const handleOpenPanel = (tab: MeetTab) => {
    if (panelOpen && activeTab === tab) {
      setPanelOpen(false);
    } else {
      setActiveTab(tab);
      setPanelOpen(true);
    }
  };

  const handleToggleVoiceMode = () => {
    voice.stop();
    const next = prefs.preferences.voiceMode === "translated" ? "original" : "translated";
    prefs.setVoiceMode(next);
    pushToast(
      next === "translated" ? "Switched to AI Translated Voice" : "Switched to Original Audio",
    );
  };

  const errors = [
    classroom.error ? { text: classroom.error, header: "Room problem" } : null,
    classroom.mediaProblem
      ? {
          text: `${classroom.mediaProblem.message} ${classroom.mediaProblem.hint}`,
          header: "Camera / microphone",
        }
      : null,
  ].filter((entry): entry is { text: string; header: string } => entry !== null);

  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [recordingModalAction, setRecordingModalAction] = useState<"start" | "stop">("start");

  const activeSpeakerName = useMemo(() => {
    if (!peers.activeSpeakerId) return undefined;
    return classroom.participants.find((p) => p.id === peers.activeSpeakerId)?.displayName;
  }, [peers.activeSpeakerId, classroom.participants]);

  const currentCaption = useMemo(() => {
    if (classroom.interim?.text) return classroom.interim.text;
    if (classroom.segments.length > 0) {
      return classroom.segments[classroom.segments.length - 1].originalText;
    }
    return undefined;
  }, [classroom.interim, classroom.segments]);

  const recording = useMeetingRecording({
    meetingCode: classroom.meeting?.code ?? meetingCode,
    participantId: classroom.self?.id ?? null,
    participantName: classroom.self?.displayName ?? name,
    isHost: classroom.isHost,
    transport,
    localStream: classroom.localStream,
    remoteStreams: streams,
    screenStream: classroom.screenStream,
    activeSpeakerName,
    currentCaption,
  });

  const handleToggleRecording = useCallback(() => {
    if (recording.isRecording) {
      setRecordingModalAction("stop");
      setShowRecordingModal(true);
    } else {
      setRecordingModalAction("start");
      setShowRecordingModal(true);
    }
  }, [recording.isRecording]);

  const handleConfirmRecording = useCallback(async () => {
    setShowRecordingModal(false);
    if (recordingModalAction === "start") {
      try {
        await recording.startRecording();
        pushToast("Recording started");
      } catch (err) {
        pushToast(err instanceof Error ? err.message : "Could not start recording", "warn");
      }
    } else {
      try {
        pushToast("Saving recording and uploading to server archive...");
        const result = await recording.stopRecording();
        if (result.recording) {
          pushToast("Recording saved and uploaded to server archive.");
        } else {
          pushToast("Recording saved locally (.webm).");
        }
      } catch {
        pushToast("Error saving recording.", "warn");
      }
    }
  }, [recording, recordingModalAction, pushToast]);

  return (
    <div className="flex h-full w-full overflow-hidden flex-col bg-background text-text-primary select-none">
      {/* Sleek Google Meet Top Bar */}
      <ClassroomHeader
        title={classroom.meeting?.title ?? (simulated ? "Demo classroom" : "NexClass Classroom")}
        code={classroom.meeting?.code ?? meetingCode.toUpperCase()}
        status={classroom.status}
        startedAt={classroom.meeting?.startedAt ?? null}
        demo={simulated}
        isRecording={recording.isRecording}
        recordingElapsed={recording.durationSeconds}
      />

      {/* Main Google Meet Stage + Sliding Side Panel Container */}
      <div className="relative flex flex-1 min-h-0 min-w-0 overflow-hidden p-2 sm:p-3 gap-2 sm:gap-3">
        {/* Full-Height Video Stage Viewport */}
        <div className="relative flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl bg-black/40">
          {/* Floating Diagnostic / Media Problem Banners */}
          <AnimatePresence initial={false}>
            {errors.map((entry) => (
              <motion.div
                key={entry.header}
                initial={reduced ? { opacity: 1 } : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                role="alert"
                className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex max-w-lg items-center gap-2.5 rounded-xl border border-signal-warn/50 bg-surface/95 px-3.5 py-2 shadow-2xl backdrop-blur-xl"
              >
                <CircleAlert className="h-4 w-4 shrink-0 text-signal-warn" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-signal-warn">{entry.header}</p>
                  <p className="text-2xs text-text-secondary">{entry.text}</p>
                </div>
                {entry.header === "Camera / microphone" && (
                  <button
                    type="button"
                    onClick={() => void classroom.requestMedia()}
                    className="nc-focus flex items-center gap-1 rounded-lg border border-signal-warn/50 px-2 py-1 text-2xs font-semibold text-signal-warn hover:bg-signal-warn/15"
                  >
                    <RefreshCw className="h-3 w-3" /> Retry
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (entry.header === "Camera / microphone") classroom.dismissMediaProblem();
                    else classroom.dismissError();
                  }}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Quick Guide Overlay */}
          <AnimatePresence>
            {showQuickGuide && (
              <motion.div
                initial={reduced ? { opacity: 1 } : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex max-w-xl items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-surface/90 px-4 py-2.5 text-xs text-text-primary shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary/20 text-primary">
                    ✨
                  </span>
                  <div className="text-2xs leading-relaxed sm:text-xs">
                    {classroom.isHost ? (
                      <>
                        <strong className="text-primary font-semibold">Teacher:</strong> Speak naturally into your mic. Your lecture is translated live into each learner&apos;s language. Code: <span className="font-mono font-bold text-primary">{classroom.meeting?.code ?? meetingCode}</span>.
                      </>
                    ) : (
                      <>
                        <strong className="text-primary font-semibold">Student:</strong> Live speech is translated into your chosen language. Click any technical term in subtitles for glosses.
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={dismissQuickGuide}
                  className="nc-focus shrink-0 rounded-lg border border-primary/40 bg-primary/15 px-2.5 py-1 text-2xs font-semibold text-primary hover:bg-primary/25"
                >
                  Got it
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Maximized Google Meet Video Grid */}
          <Stage
            participants={classroom.participants}
            selfId={classroom.self?.id ?? null}
            streams={streams}
            statuses={statuses}
            localStream={classroom.localStream}
            screenStream={classroom.screenStream}
            activeSpeakerId={peers.activeSpeakerId}
            audioMuted={
              prefs.preferences.voiceMode === "translated" ||
              simulated ||
              transport.kind === "demo"
            }
            className="h-full w-full flex-1"
          />

          {/* Google Meet-Style Floating Caption Overlay (Inside Stage at bottom) */}
          <CaptionOverlay
            segments={classroom.segments}
            interim={classroom.interim}
            captionLanguage={classroom.captionLanguage}
            captionMode={prefs.preferences.captionMode}
            scale={prefs.preferences.captionScale}
            visible={prefs.preferences.captionsVisible}
          />
        </div>

        {/* Google Meet 360px Sliding Right Drawer */}
        <AnimatePresence>
          {panelOpen && (
            <MeetSidePanel
              open={panelOpen}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onClose={() => setPanelOpen(false)}
              unreadChat={panelOpen && activeTab === "chat" ? 0 : classroom.unreadChat}
              participantsProps={{
                participants: classroom.participants,
                selfId: classroom.self?.id ?? null,
                activeSpeakerId: peers.activeSpeakerId,
                isHost: classroom.isHost,
                onEndMeeting: () => void handleEndMeeting(),
                ending,
              }}
              chatProps={{
                messages: classroom.chat,
                selfId: classroom.self?.id ?? null,
                onSend: classroom.sendChat,
                disabled: classroom.meeting
                  ? !classroom.meeting.settings.participantPermissions.canChat
                  : false,
                disabledReason: "The host disabled chat for this class.",
              }}
              languageHubProps={{
                voiceMode: prefs.preferences.voiceMode,
                onVoiceModeChange: (mode) => {
                  voice.stop();
                  prefs.setVoiceMode(mode);
                },
                captionLanguage: classroom.captionLanguage,
                voiceLanguage: classroom.voiceLanguage,
                availableLanguages,
                onCaptionLanguage: classroom.setCaptionLanguage,
                onVoiceLanguage: (lang) => {
                  voice.stop();
                  classroom.setVoiceLanguage(lang);
                },
                voice,
                voiceMuted: prefs.preferences.voiceMuted,
                onVoiceMuted: prefs.setVoiceMuted,
                voiceVolume: prefs.preferences.voiceVolume,
                onVoiceVolume: prefs.setVoiceVolume,
                listening: recognition.listening,
              }}
              recordingsProps={{
                recordings: recording.recordings,
                loading: recording.loadingRecordings,
                onRefresh: () => void recording.fetchRecordings(),
                isRecording: recording.isRecording,
                recordingElapsed: recording.durationSeconds,
                onStartRecording: () => {
                  setRecordingModalAction("start");
                  setShowRecordingModal(true);
                },
                onStopRecording: () => {
                  setRecordingModalAction("stop");
                  setShowRecordingModal(true);
                },
                isHost: classroom.isHost,
              }}
              meetingInfo={{
                meeting: classroom.meeting,
                meetingCode,
                isHost: classroom.isHost,
                status: classroom.status,
                providerStatus: classroom.providerStatus,
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Google Meet Circular Bottom Toolbar */}
      <ClassroomToolbar
        audioEnabled={classroom.audioEnabled}
        videoEnabled={classroom.videoEnabled}
        screenSharing={classroom.screenSharing}
        captionsVisible={prefs.preferences.captionsVisible}
        unreadChat={classroom.unreadChat}
        isHost={classroom.isHost}
        disabled={classroom.status === "disconnected" && !simulated}
        simulated={simulated}
        onToggleAudio={() => {
          classroom.toggleAudio();
          pushToast(classroom.audioEnabled ? "Microphone muted" : "Microphone unmuted");
        }}
        onToggleVideo={() => {
          classroom.toggleVideo();
          pushToast(classroom.videoEnabled ? "Camera turned off" : "Camera turned on");
        }}
        onToggleShare={() => {
          void classroom.toggleScreenShare();
          pushToast(classroom.screenSharing ? "Screen share stopped" : "Screen share started");
        }}
        onToggleCaptions={() => {
          prefs.toggleCaptionsVisible();
          pushToast(
            prefs.preferences.captionsVisible ? "Captions hidden" : "Captions turned on",
          );
        }}
        onOpenPanel={handleOpenPanel}
        activePanelTab={activeTab}
        panelOpen={panelOpen}
        onLeave={handleLeave}
        onEndMeeting={() => void handleEndMeeting()}
        meetingCode={classroom.meeting?.code ?? meetingCode}
        participantCount={classroom.participants.length}
        voiceMode={prefs.preferences.voiceMode}
        onToggleVoiceMode={handleToggleVoiceMode}
        isRecording={recording.isRecording}
        recordingElapsed={recording.durationSeconds}
        onToggleRecording={handleToggleRecording}
      />

      {/* Recording Confirmation Modal */}
      <AnimatePresence>
        {showRecordingModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recording-modal-title"
          >
            <motion.div
              initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: reduced ? 0 : 0.15 }}
              className="w-full max-w-md rounded-2xl border border-border/80 bg-surface/95 p-6 shadow-2xl backdrop-blur-2xl text-text-primary"
            >
              <div className="flex items-start gap-4">
                <div
                  className={clsx(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                    recordingModalAction === "start"
                      ? "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                      : "bg-signal-warn/15 text-signal-warn border border-signal-warn/30",
                  )}
                >
                  <Disc className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 id="recording-modal-title" className="text-base font-semibold">
                    {recordingModalAction === "start" ? "Start recording?" : "Stop recording?"}
                  </h3>
                  <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                    {recordingModalAction === "start"
                      ? "Recording will capture video, microphone, and translated audio for all participants. Start recording?"
                      : "The recording will end immediately, download a copy to your computer (.webm), and save an archive copy to the server."}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRecordingModal(false)}
                  className="nc-focus rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmRecording()}
                  className={clsx(
                    "nc-focus inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-md transition-all",
                    recordingModalAction === "start"
                      ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/25"
                      : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/25",
                  )}
                >
                  {recordingModalAction === "start" ? "Start recording" : "Stop & Save"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Notification Toasts */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-24 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-1.5 px-3"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.p
              key={toast.id}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: reduced ? 0 : 0.2 }}
              className={clsx(
                "pointer-events-auto rounded-xl border px-3.5 py-2 text-center text-xs font-semibold shadow-2xl backdrop-blur-xl",
                toast.tone === "warn"
                  ? "border-signal-warn/40 bg-surface/95 text-signal-warn"
                  : "border-primary/40 bg-surface/95 text-text-primary",
              )}
            >
              {toast.text}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
