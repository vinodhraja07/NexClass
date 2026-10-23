import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CircleAlert, RefreshCw, X } from "lucide-react";
import clsx from "clsx";
import type { MeetingTransport } from "@/lib/transport";
import { api } from "@/lib/api";
import { useClassroom } from "@/hooks/useClassroom";
import { usePeerConnections } from "@/hooks/usePeerConnections";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useVoicePlayback } from "@/hooks/useVoicePlayback";
import { useClassroomPreferences } from "@/hooks/useClassroomPreferences";
import type { LanguageCode } from "@nexclass/shared";
import type { TileStatus } from "./VideoTile";
import { ClassroomHeader } from "./ClassroomHeader";
import { ClassroomToolbar } from "./ClassroomToolbar";
import { ControlTray } from "./ControlTray";
import { Stage } from "./Stage";
import { CaptionStrip } from "./CaptionStrip";
import { PanelDock, type PanelState, type SidePanelTab } from "./PanelDock";

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

function useIsCompact() {
  const [compact, setCompact] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia("(max-width: 1279px)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1279px)");
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return compact;
}

/**
 * The classroom core.
 *
 * Transport-agnostic by design: the exact same component tree runs against the
 * Socket.IO server and the local demo simulator.
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
  const compact = useIsCompact();

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

  const voice = useVoicePlayback({
    segments: classroom.segments,
    voiceLanguage: classroom.voiceLanguage,
    enabled: prefs.preferences.voiceMode === "translated",
    muted: prefs.preferences.voiceMuted,
    volume: prefs.preferences.voiceVolume,
    active: voiceActive ?? true,
  });

  /* ------------------------------ local state ----------------------------- */

  const [activeTab, setActiveTab] = useState<SidePanelTab>("participants");
  const [panelOpen, setPanelOpen] = useState(true);
  const [ending, setEnding] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const pushToast = useCallback((text: string, tone: Toast["tone"] = "neutral") => {
    toastIdRef.current += 1;
    const id = toastIdRef.current;
    setToasts((current) => [...current.slice(-2), { id, text, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  /* -------------------------------- effects ------------------------------- */

  // Ask for camera and microphone as soon as the room is joined (live only).
  const askedMediaRef = useRef(false);
  useEffect(() => {
    if (transport.kind !== "live") return;
    if (classroom.status !== "connected") return;
    if (askedMediaRef.current) return;
    askedMediaRef.current = true;
    void classroom.requestMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transport.kind, classroom.status]);

  // Chat unread clearing while the chat tab is visible.
  useEffect(() => {
    if (panelOpen && activeTab === "chat") classroom.markChatRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, panelOpen, classroom.unreadChat]);

  // Keyboard shortcuts: m mic, v camera, c captions.
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

  /* -------------------------------- actions ------------------------------- */

  const availableLanguages = classroom.meeting?.availableLanguages ?? [];

  const handleLeave = useCallback(() => {
    classroom.leave();
    if (transport.kind === "live") {
      // The room state is server-side; clear the local session so a reload
      // cannot resurrect a dead socket.
      // Guest tokens are per meeting and stay for the join page to reuse.
    }
    onLeft?.();
  }, [classroom, onLeft, transport.kind]);

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

  /* --------------------------------- panel -------------------------------- */

  const streams: Record<string, MediaStream | null> = Object.fromEntries(
    Object.entries(peers.peers).map(([id, entry]) => [id, entry.stream]),
  );
  const statuses: Record<string, TileStatus> = Object.fromEntries(
    Object.entries(peers.peers).map(([id, entry]) => [id, entry.status]),
  );

  const panel: PanelState = {
    tab: activeTab,
    chat: {
      messages: classroom.chat,
      selfId: classroom.self?.id ?? null,
      onSend: classroom.sendChat,
      disabled: classroom.meeting
        ? !classroom.meeting.settings.participantPermissions.canChat
        : false,
      disabledReason: "The host disabled chat for this class.",
    },
    participants: {
      participants: classroom.participants,
      selfId: classroom.self?.id ?? null,
      activeSpeakerId: peers.activeSpeakerId,
      isHost: classroom.isHost,
      onEndMeeting: () => void handleEndMeeting(),
      ending,
    },
    captions: {
      segments: classroom.segments,
      interim: classroom.interim,
      captionLanguage: classroom.captionLanguage,
      captionMode: prefs.preferences.captionMode,
      onCaptionModeChange: prefs.setCaptionMode,
      scale: prefs.preferences.captionScale,
      onScaleChange: prefs.setCaptionScale,
      captionsVisible: prefs.preferences.captionsVisible,
      onCaptionsVisibleChange: prefs.setCaptionsVisible,
      recognition,
      speakerLanguage,
      onManualCaption: (text: string) =>
        transport.emit("caption:original", { text, language: speakerLanguage }),
      canPushCaptions,
    },
    settings: {
      meeting: classroom.meeting,
      self: classroom.self,
      status: classroom.status,
      providerStatus: classroom.providerStatus,
      interfaceLanguage: classroom.interfaceLanguage,
      availableLanguages,
      onInterfaceLanguage: (value: string) =>
        classroom.setInterfaceLanguage(value as LanguageCode),
      captionScale: prefs.preferences.captionScale,
      onCaptionScale: prefs.setCaptionScale,
      meetingCode,
      isHost: classroom.isHost,
      simulated,
      onLeave: handleLeave,
      onEndMeeting: () => void handleEndMeeting(),
    },
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

  return (
    <div className="flex h-full min-h-0 flex-col bg-ink-900 text-ivory-100">
      <ClassroomHeader
        title={classroom.meeting?.title ?? (simulated ? "Demo classroom" : "NexClass classroom")}
        code={classroom.meeting?.code ?? meetingCode.toUpperCase()}
        status={classroom.status}
        startedAt={classroom.meeting?.startedAt ?? null}
        demo={simulated}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 md:p-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-col gap-3 overflow-y-auto xl:pr-1">
          {/* banners */}
          <AnimatePresence initial={false}>
            {errors.map((entry) => (
              <motion.div
                key={entry.header}
                initial={reduced ? { opacity: 1 } : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: reduced ? 0 : 0.2 }}
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-signal-warn/40 bg-signal-warn/10 px-3 py-2.5"
              >
                <CircleAlert
                  className="mt-0.5 h-4 w-4 shrink-0 text-signal-warn"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-signal-warn">{entry.header}</p>
                  <p className="text-2xs leading-relaxed text-ivory-200">{entry.text}</p>
                </div>
                {entry.header === "Camera / microphone" ? (
                  <button
                    type="button"
                    onClick={() => void classroom.requestMedia()}
                    className="nc-focus inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-signal-warn/50 px-2.5 text-2xs font-medium text-signal-warn transition-colors hover:bg-signal-warn/15"
                  >
                    <RefreshCw className="h-3 w-3" aria-hidden="true" />
                    Retry
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    if (entry.header === "Camera / microphone") classroom.dismissMediaProblem();
                    else classroom.dismissError();
                  }}
                  aria-label="Dismiss alert"
                  className="nc-focus grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ivory-300 hover:text-ivory-50"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          <Stage
            participants={classroom.participants}
            selfId={classroom.self?.id ?? null}
            streams={streams}
            statuses={statuses}
            localStream={classroom.localStream}
            screenStream={classroom.screenStream}
            activeSpeakerId={peers.activeSpeakerId}
            audioMuted={prefs.preferences.voiceMode === "translated"}
            className="min-h-[260px] flex-1"
          />

          {prefs.preferences.captionsVisible ? (
            <CaptionStrip
              segments={classroom.segments}
              interim={classroom.interim}
              captionLanguage={classroom.captionLanguage}
              captionMode={prefs.preferences.captionMode}
              scale={prefs.preferences.captionScale}
              visible
            />
          ) : null}

          <ControlTray
            voiceMode={prefs.preferences.voiceMode}
            onVoiceModeChange={prefs.setVoiceMode}
            captionLanguage={classroom.captionLanguage}
            voiceLanguage={classroom.voiceLanguage}
            availableLanguages={availableLanguages}
            onCaptionLanguage={classroom.setCaptionLanguage}
            onVoiceLanguage={classroom.setVoiceLanguage}
            voice={voice}
            voiceMuted={prefs.preferences.voiceMuted}
            onVoiceMuted={prefs.setVoiceMuted}
            voiceVolume={prefs.preferences.voiceVolume}
            onVoiceVolume={prefs.setVoiceVolume}
            listening={recognition.listening}
          />
        </div>

        {compact ? null : (
          <div className="hidden min-h-0 min-w-0 xl:block">
            <PanelDock
              panel={panel}
              active={activeTab}
              onActive={(tab) => {
                setActiveTab(tab);
                setPanelOpen(true);
              }}
              onDismiss={() => setPanelOpen(false)}
              unreadChat={panelOpen && activeTab === "chat" ? 0 : classroom.unreadChat}
            />
          </div>
        )}
      </div>

      {/* mobile bottom sheet */}
      {compact ? (
        <PanelDock
          compact
          open={panelOpen}
          panel={panel}
          active={activeTab}
          onActive={(tab) => {
            setActiveTab(tab);
            setPanelOpen(true);
          }}
          onDismiss={() => setPanelOpen(false)}
          unreadChat={classroom.unreadChat}
        />
      ) : null}

      <ClassroomToolbar
        audioEnabled={classroom.audioEnabled}
        videoEnabled={classroom.videoEnabled}
        screenSharing={classroom.screenSharing}
        captionsVisible={prefs.preferences.captionsVisible}
        unreadChat={classroom.unreadChat}
        isHost={classroom.isHost}
        disabled={classroom.status === "disconnected" && !simulated}
        onToggleAudio={() => {
          classroom.toggleAudio();
          pushToast(classroom.audioEnabled ? "Microphone muted" : "Microphone live");
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
            prefs.preferences.captionsVisible ? "Captions hidden" : "Captions shown",
          );
        }}
        onOpenPanel={(tab) => {
          setActiveTab(tab);
          setPanelOpen(true);
        }}
        onLeave={handleLeave}
        onEndMeeting={() => void handleEndMeeting()}
      />

      {/* toasts */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-16 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-1.5 px-3"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.p
              key={toast.id}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: reduced ? 0 : 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              className={clsx(
                "pointer-events-auto w-full rounded-xl border px-3.5 py-2 text-center text-[13px] shadow-lift backdrop-blur",
                toast.tone === "warn"
                  ? "border-signal-warn/40 bg-ink-800/95 text-signal-warn"
                  : "border-accent-400/35 bg-ink-800/95 text-ivory-100",
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

