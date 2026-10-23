import type {
  ChatMessagePublic,
  LanguageCode,
  MeetingPublic,
  ParticipantPublic,
  SegmentStatus,
} from "@nexclass/shared";

export type ConnectionStatus = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected";

export interface CaptionTranslation {
  text: string;
  provider: string;
  status: SegmentStatus;
  latencyMs: number;
  error?: string;
}

export interface CaptionVoice {
  provider: string;
  status: SegmentStatus;
  latencyMs: number;
  audioUrl?: string | null;
  error?: string;
}

export interface CaptionSegmentPayload {
  id: string;
  speakerId: string;
  speakerName: string;
  originalLanguage: LanguageCode;
  originalText: string;
  startTime: number;
  endTime: number;
  status: SegmentStatus;
  translations: Record<string, CaptionTranslation>;
  voices: Record<string, CaptionVoice>;
  protectedTerms: { termId: string; surface: string }[];
  error?: string;
}

export interface ProviderRuntimeStatus {
  translationConfigured: boolean;
  ttsConfigured: boolean;
  stunServers: string[];
  turnConfigured: boolean;
}

export interface SharedResourceDescriptor {
  id: string;
  labelKey: string;
  descriptionKey: string;
  instructionKey: string;
}

export interface SharedResourceEvent {
  resourceId: string;
  resources: SharedResourceDescriptor[];
  labelsByLanguage: Record<
    string,
    Record<string, string>
  >;
}

export interface ServerEventMap {
  "meeting:joined": {
    participant: ParticipantPublic;
    meeting: MeetingPublic;
    participants: ParticipantPublic[];
    providerStatus: ProviderRuntimeStatus;
    labels: Record<string, string>;
  };
  "participant:joined": { participant: ParticipantPublic };
  "participant:left": { participantId: string };
  "participant:updated": { participant: ParticipantPublic };
  "webrtc:offer": { fromId: string; sdp: RTCSessionDescriptionInit };
  "webrtc:answer": { fromId: string; sdp: RTCSessionDescriptionInit };
  "webrtc:ice": { fromId: string; candidate: RTCIceCandidateInit };
  "caption:interim": {
    speakerId: string;
    speakerName: string;
    text: string;
    language: LanguageCode;
  };
  "caption:segment": { segment: CaptionSegmentPayload };
  "chat:message": { message: ChatMessagePublic };
  "room:resource": SharedResourceEvent;
  "room:labels": { labels: Record<string, string> };
  "error:message": { code: string; message: string };
}

export interface ClientEventMap {
  "meeting:join": {
    meetingCode: string;
    name?: string;
    language?: LanguageCode;
    captionLanguage?: LanguageCode;
    voiceLanguage?: LanguageCode;
  };
  "meeting:leave": undefined;
  "media:state": {
    audioEnabled?: boolean;
    videoEnabled?: boolean;
    screenSharing?: boolean;
    handRaised?: boolean;
  };
  "preferences:set": {
    captionLanguage?: LanguageCode;
    voiceLanguage?: LanguageCode;
    interfaceLanguage?: LanguageCode;
  };
  "webrtc:offer": { toId: string; sdp: RTCSessionDescriptionInit };
  "webrtc:answer": { toId: string; sdp: RTCSessionDescriptionInit };
  "webrtc:ice": { toId: string; candidate: RTCIceCandidateInit };
  "caption:interim": { text: string; language?: LanguageCode };
  "caption:original": {
    text: string;
    language?: LanguageCode;
    startTime?: number;
    endTime?: number;
  };
  "chat:send": { message: string };
  "room:resource:set": { resourceId: string };
}

/**
 * Transport abstraction so the classroom UI can run against the live Socket.IO
 * meeting server or against the built-in interactive demo without changing a
 * single component.
 */
export interface MeetingTransport {
  readonly kind: "live" | "demo";
  connect(): Promise<void>;
  disconnect(): void;
  emit<E extends keyof ClientEventMap>(event: E, payload: ClientEventMap[E]): void;
  on<E extends keyof ServerEventMap>(
    event: E,
    handler: (payload: ServerEventMap[E]) => void,
  ): () => void;
  getStatus(): ConnectionStatus;
  onStatusChange(handler: (status: ConnectionStatus) => void): () => void;
}
