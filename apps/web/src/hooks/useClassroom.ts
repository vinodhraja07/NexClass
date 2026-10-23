import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ChatMessagePublic,
  LanguageCode,
  MeetingPublic,
  ParticipantPublic,
} from "@nexclass/shared";
import type {
  CaptionSegmentPayload,
  ConnectionStatus,
  MeetingTransport,
  ProviderRuntimeStatus,
  ServerEventMap,
} from "@/lib/transport";
import { api } from "@/lib/api";

const MAX_SEGMENTS = 120;
const MAX_CHAT = 200;

export type MediaProblemKind = "denied" | "missing" | "busy" | "unsupported" | "error";

export interface MediaProblem {
  kind: MediaProblemKind;
  message: string;
  hint: string;
}

export interface InterimCaption {
  speakerId: string;
  speakerName: string;
  text: string;
  language: LanguageCode;
}

export interface UseClassroomResult {
  status: ConnectionStatus;
  meeting: MeetingPublic | null;
  self: ParticipantPublic | null;
  participants: ParticipantPublic[];
  providerStatus: ProviderRuntimeStatus | null;
  labels: Record<string, string>;
  segments: CaptionSegmentPayload[];
  interim: InterimCaption | null;
  chat: ChatMessagePublic[];
  unreadChat: number;
  error: string | null;
  mediaProblem: MediaProblem | null;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  captionLanguage: LanguageCode;
  voiceLanguage: LanguageCode;
  interfaceLanguage: LanguageCode;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  isHost: boolean;
  setCaptionLanguage: (language: LanguageCode) => void;
  setVoiceLanguage: (language: LanguageCode) => void;
  setInterfaceLanguage: (language: LanguageCode) => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  requestMedia: () => Promise<void>;
  stopScreenShare: () => void;
  sendChat: (message: string) => void;
  markChatRead: () => void;
  dismissError: () => void;
  dismissMediaProblem: () => void;
  leave: () => void;
}

function describeMediaError(error: unknown): MediaProblem {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return {
      kind: "denied",
      message: "Camera and microphone access was blocked.",
      hint:
        "Allow access from the site permissions in your browser address bar, then press retry. Captions, chat and translated voice all keep working without it.",
    };
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return {
      kind: "missing",
      message: "No camera or microphone was found on this device.",
      hint: "You can still join and receive captions. Plug in a microphone and retry when you are ready.",
    };
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return {
      kind: "busy",
      message: "Another application is already using your camera or microphone.",
      hint: "Close the other application and press retry.",
    };
  }
  return {
    kind: "error",
    message: "The browser could not start your camera and microphone.",
    hint: "Press retry. If it keeps failing, join without media - captions and chat still work.",
  };
}

/**
 * Merges an incoming caption segment into the local history.
 *
 * The original transcript is written once and never overwritten by a later
 * update: the server first emits a "processing" segment and later the
 * completed one. Only the derived translations and voice entries are merged.
 */
function mergeSegment(
  current: CaptionSegmentPayload[],
  incoming: CaptionSegmentPayload,
): CaptionSegmentPayload[] {
  const index = current.findIndex((segment) => segment.id === incoming.id);
  if (index === -1) {
    return [...current, incoming].slice(-MAX_SEGMENTS);
  }
  const existing = current[index];
  const merged: CaptionSegmentPayload = {
    ...existing,
    ...incoming,
    originalText: incoming.originalText || existing.originalText,
    originalLanguage: incoming.originalLanguage || existing.originalLanguage,
    speakerName: incoming.speakerName || existing.speakerName,
    startTime: incoming.startTime || existing.startTime,
    endTime: incoming.endTime || existing.endTime,
    translations: { ...existing.translations, ...incoming.translations },
    voices: { ...existing.voices, ...incoming.voices },
    protectedTerms: incoming.protectedTerms?.length
      ? incoming.protectedTerms
      : existing.protectedTerms,
  };
  const next = current.slice();
  next[index] = merged;
  return next;
}

function upsertParticipant(
  participants: ParticipantPublic[],
  participant: ParticipantPublic,
): ParticipantPublic[] {
  const index = participants.findIndex((entry) => entry.id === participant.id);
  if (index === -1) return [...participants, participant];
  const next = participants.slice();
  next[index] = participant;
  return next;
}

/**
 * The single source of truth for a classroom session.
 *
 * The hook only talks to the `MeetingTransport` interface, so the very same
 * state machine drives the live Socket.IO classroom and the local interactive
 * demo. Nothing in here knows whether it is talking to a server or a
 * simulator.
 */
export interface JoinContext {
  meetingCode: string;
  name?: string;
  language?: LanguageCode;
  captionLanguage?: LanguageCode;
  voiceLanguage?: LanguageCode;
}

export function useClassroom(
  transport: MeetingTransport,
  initialMeeting?: MeetingPublic | null,
  initialSelf?: ParticipantPublic | null,
  joinContext?: JoinContext,
): UseClassroomResult {
  const [status, setStatus] = useState<ConnectionStatus>(transport.getStatus());
  const [meeting, setMeeting] = useState<MeetingPublic | null>(initialMeeting ?? null);
  const [self, setSelf] = useState<ParticipantPublic | null>(initialSelf ?? null);
  const [participants, setParticipants] = useState<ParticipantPublic[]>([]);
  const [providerStatus, setProviderStatus] = useState<ProviderRuntimeStatus | null>(null);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [segments, setSegments] = useState<CaptionSegmentPayload[]>([]);
  const [interim, setInterim] = useState<InterimCaption | null>(null);
  const [chat, setChat] = useState<ChatMessagePublic[]>([]);
  const [unreadChat, setUnreadChat] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mediaProblem, setMediaProblem] = useState<MediaProblem | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const audioEnabled = self?.audioEnabled ?? true;
  const videoEnabled = self?.videoEnabled ?? false;
  const screenSharing = self?.screenSharing ?? false;

  // Language picks stay visible even when the server has not confirmed the
  // join yet (or the transport is offline) - the socket will mirror them.
  const [localLanguages, setLocalLanguages] = useState<{
    caption: LanguageCode;
    voice: LanguageCode;
    interface: LanguageCode;
  }>({
    caption: joinContext?.captionLanguage ?? joinContext?.language ?? "en",
    voice: joinContext?.voiceLanguage ?? joinContext?.language ?? "en",
    interface: joinContext?.language ?? "en",
  });

  const captionLanguage = self?.captionLanguage ?? localLanguages.caption;
  const voiceLanguage = self?.voiceLanguage ?? localLanguages.voice;
  const interfaceLanguage = self?.interfaceLanguage ?? localLanguages.interface;

  const selfIdRef = useRef<string | null>(initialSelf?.id ?? null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const meetingRef = useRef<MeetingPublic | null>(initialMeeting ?? null);
  const selfRef = useRef<ParticipantPublic | null>(initialSelf ?? null);
  const joinContextRef = useRef<JoinContext | undefined>(joinContext);

  useEffect(() => {
    joinContextRef.current = joinContext;
  }, [joinContext]);

  useEffect(() => {
    meetingRef.current = meeting;
  }, [meeting]);

  useEffect(() => {
    selfRef.current = self;
  }, [self]);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    screenStreamRef.current = screenStream;
  }, [screenStream]);

  /* --------------------------- transport wiring -------------------------- */

  useEffect(() => {
    let cancelled = false;
    let offs: Array<() => void> = [];

    const register = () => {
      const statusOff = transport.onStatusChange(setStatus);
      const joinedOff = transport.on("meeting:joined", (payload: ServerEventMap["meeting:joined"]) => {
        selfIdRef.current = payload.participant.id;
        setSelf(payload.participant);
        setMeeting(payload.meeting);
        setParticipants(payload.participants);
        setProviderStatus(payload.providerStatus);
        setLabels(payload.labels ?? {});
        setError(null);
      });
      const participantJoinedOff = transport.on(
        "participant:joined",
        (payload: ServerEventMap["participant:joined"]) => {
          setParticipants((current) => upsertParticipant(current, payload.participant));
        },
      );
      const participantLeftOff = transport.on(
        "participant:left",
        (payload: ServerEventMap["participant:left"]) => {
          setParticipants((current) =>
            current.filter((participant) => participant.id !== payload.participantId),
          );
        },
      );
      const participantUpdatedOff = transport.on(
        "participant:updated",
        (payload: ServerEventMap["participant:updated"]) => {
          setParticipants((current) => upsertParticipant(current, payload.participant));
          if (payload.participant.id === selfIdRef.current) {
            setSelf(payload.participant);
          }
        },
      );
      const interimOff = transport.on(
        "caption:interim",
        (payload: ServerEventMap["caption:interim"]) => {
          setInterim({
            speakerId: payload.speakerId,
            speakerName: payload.speakerName,
            text: payload.text,
            language: payload.language,
          });
        },
      );
      const segmentOff = transport.on(
        "caption:segment",
        (payload: ServerEventMap["caption:segment"]) => {
          setInterim(null);
          setSegments((current) => mergeSegment(current, payload.segment));
        },
      );
      const chatOff = transport.on("chat:message", (payload: ServerEventMap["chat:message"]) => {
        setChat((current) => {
          if (current.some((message) => message.id === payload.message.id)) return current;
          const next = [...current, payload.message];
          return next.slice(-MAX_CHAT);
        });
        // Your own messages are never counted as unread.
        if (payload.message.senderId !== selfIdRef.current) {
          setUnreadChat((count) => count + 1);
        }
      });
      const labelsOff = transport.on("room:labels", (payload: ServerEventMap["room:labels"]) => {
        setLabels(payload.labels ?? {});
      });
      const errorOff = transport.on("error:message", (payload: ServerEventMap["error:message"]) => {
        setError(payload.message || "The meeting server reported a problem.");
      });

      offs = [
        statusOff,
        joinedOff,
        participantJoinedOff,
        participantLeftOff,
        participantUpdatedOff,
        interimOff,
        segmentOff,
        chatOff,
        labelsOff,
        errorOff,
      ];
    };

    // Register before connecting: the demo transport emits "meeting:joined"
    // as part of connect().
    register();

    transport
      .connect()
      .then(() => {
        if (cancelled) return;
        if (transport.kind === "live") {
          // SocketTransport only starts accepting socket.io listeners once the
          // socket object exists, so the handlers are re-bound after the
          // connection is established. The first registration was a no-op.
          offs.forEach((off) => off());
          offs = [];
          register();
        }
        transport.emit("meeting:join", {
          meetingCode: joinContextRef.current?.meetingCode ?? meetingRef.current?.code ?? "",
          name: selfRef.current?.displayName ?? joinContextRef.current?.name,
          language: selfRef.current?.preferredLanguage ?? joinContextRef.current?.language,
          captionLanguage:
            selfRef.current?.captionLanguage ?? joinContextRef.current?.captionLanguage,
          voiceLanguage: selfRef.current?.voiceLanguage ?? joinContextRef.current?.voiceLanguage,
        });
      })
      .catch((connectError: unknown) => {
        if (cancelled) return;
        setStatus("disconnected");
        setError(
          connectError instanceof Error
            ? connectError.message
            : "Could not reach the meeting server.",
        );
      });

    return () => {
      cancelled = true;
      offs.forEach((off) => off());
      transport.disconnect();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transport]);

  /* ------------------------------- media --------------------------------- */

  const requestMedia = useCallback(async () => {
    if (transport.kind !== "live") {
      // The demo is fully simulated: toggling media only updates state.
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaProblem({
        kind: "unsupported",
        message: "This browser does not expose camera and microphone controls.",
        hint: "Use a modern browser to share video. Captions, chat and translated voice still work.",
      });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setLocalStream(stream);
      setMediaProblem(null);
      transport.emit("media:state", {
        audioEnabled: stream.getAudioTracks().some((track) => track.enabled),
        videoEnabled: stream.getVideoTracks().some((track) => track.enabled),
      });
    } catch (mediaError) {
      setMediaProblem(describeMediaError(mediaError));
    }
  }, [transport]);

  const toggleAudio = useCallback(() => {
    const next = !audioEnabled;
    setSelf((current) => (current ? { ...current, audioEnabled: next } : current));
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    transport.emit("media:state", { audioEnabled: next });
  }, [audioEnabled, transport]);

  const toggleVideo = useCallback(() => {
    const next = !videoEnabled;
    setSelf((current) => (current ? { ...current, videoEnabled: next } : current));
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    transport.emit("media:state", { videoEnabled: next });
  }, [transport, videoEnabled]);

  const stopScreenShare = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    setScreenStream(null);
    setSelf((current) => (current ? { ...current, screenSharing: false } : current));
    transport.emit("media:state", { screenSharing: false });
  }, [transport]);

  const toggleScreenShare = useCallback(async () => {
    if (screenSharing) {
      stopScreenShare();
      return;
    }
    if (transport.kind !== "live") {
      setSelf((current) => (current ? { ...current, screenSharing: true } : current));
      transport.emit("media:state", { screenSharing: true });
      return;
    }
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setMediaProblem({
        kind: "unsupported",
        message: "This browser cannot share a screen.",
        hint: "Screen sharing works in current Chrome, Edge and Firefox builds.",
      });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      setScreenStream(stream);
      setSelf((current) => (current ? { ...current, screenSharing: true } : current));
      transport.emit("media:state", { screenSharing: true });
      const [track] = stream.getVideoTracks();
      track?.addEventListener("ended", () => {
        screenStreamRef.current = null;
        setScreenStream(null);
        setSelf((current) => (current ? { ...current, screenSharing: false } : current));
        transport.emit("media:state", { screenSharing: false });
      });
    } catch {
      // The user dismissed the picker - nothing to report.
    }
  }, [screenSharing, stopScreenShare, transport]);

  /* ---------------------------- preferences ------------------------------ */

  const syncPreference = useCallback(
    (input: {
      captionLanguage?: LanguageCode;
      voiceLanguage?: LanguageCode;
      interfaceLanguage?: LanguageCode;
    }) => {
      setSelf((current) => (current ? { ...current, ...input } : current));
      setLocalLanguages((current) => ({ ...current, ...input }));
      transport.emit("preferences:set", input);
      const code = meeting?.code;
      if (transport.kind === "live" && code) {
        // Best effort mirror to the REST API. Guests are not authorised there,
        // so a failure is expected and harmless - the socket already applied it.
        void api.setPreferences(code, input).catch(() => undefined);
      }
    },
    [meeting?.code, transport],
  );

  const setCaptionLanguage = useCallback(
    (language: LanguageCode) => syncPreference({ captionLanguage: language }),
    [syncPreference],
  );
  const setVoiceLanguage = useCallback(
    (language: LanguageCode) => syncPreference({ voiceLanguage: language }),
    [syncPreference],
  );
  const setInterfaceLanguage = useCallback(
    (language: LanguageCode) => syncPreference({ interfaceLanguage: language }),
    [syncPreference],
  );

  /* -------------------------------- chat --------------------------------- */

  const sendChat = useCallback(
    (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;
      transport.emit("chat:send", { message: trimmed.slice(0, 1000) });
    },
    [transport],
  );

  const markChatRead = useCallback(() => setUnreadChat(0), []);

  /* -------------------------------- leave -------------------------------- */

  const leave = useCallback(() => {
    transport.emit("meeting:leave", undefined);
    const code = meeting?.code;
    if (code && transport.kind === "live") {
      void api.leaveMeeting(code).catch(() => undefined);
    }
  }, [meeting?.code, transport]);

  const isHost = Boolean(self && (self.role === "teacher" || meeting?.hostId === self.id));

  const participantsById = useMemo(() => {
    const map = new Map<string, ParticipantPublic>();
    participants.forEach((participant) => map.set(participant.id, participant));
    if (self) map.set(self.id, self);
    return Array.from(map.values());
  }, [participants, self]);

  return {
    status,
    meeting,
    self,
    participants: participantsById,
    providerStatus,
    labels,
    segments,
    interim,
    chat,
    unreadChat,
    error,
    mediaProblem,
    localStream,
    screenStream,
    captionLanguage,
    voiceLanguage,
    interfaceLanguage,
    audioEnabled,
    videoEnabled,
    screenSharing,
    isHost,
    setCaptionLanguage,
    setVoiceLanguage,
    setInterfaceLanguage,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    requestMedia,
    stopScreenShare,
    sendChat,
    markChatRead,
    dismissError: () => setError(null),
    dismissMediaProblem: () => setMediaProblem(null),
    leave,
  };
}
