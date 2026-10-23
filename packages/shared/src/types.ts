import type { LanguageCode } from "./languages";

export type MeetingStatus = "scheduled" | "live" | "ended";
export type ParticipantRole = "teacher" | "student";
export type SegmentStatus = "pending" | "processing" | "complete" | "failed";
export type ProviderStatus = "ready" | "unconfigured" | "error";

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  role: ParticipantRole;
  preferredLanguage: LanguageCode;
}

export interface MeetingSettings {
  passwordEnabled: boolean;
  participantPermissions: {
    canUnmute: boolean;
    canShareScreen: boolean;
    canChat: boolean;
  };
  defaultSpeakerLanguage: LanguageCode;
  availableLanguages: LanguageCode[];
  captionsEnabledByDefault: boolean;
  voiceEnabledByDefault: boolean;
}

export interface MeetingPublic {
  id: string;
  code: string;
  title: string;
  hostId: string;
  hostName: string;
  status: MeetingStatus;
  speakerLanguage: LanguageCode;
  availableLanguages: LanguageCode[];
  settings: MeetingSettings;
  createdAt: string;
  startedAt?: string | null;
  endedAt?: string | null;
}

export interface ParticipantPublic {
  id: string;
  meetingCode: string;
  displayName: string;
  role: ParticipantRole;
  preferredLanguage: LanguageCode;
  captionLanguage: LanguageCode;
  voiceLanguage: LanguageCode;
  interfaceLanguage: LanguageCode;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  handRaised: boolean;
  joinedAt: string;
  leftAt?: string | null;
  isSimulated?: boolean;
}

export interface TranscriptSegmentPublic {
  id: string;
  meetingId: string;
  meetingCode: string;
  speakerId: string;
  speakerName: string;
  originalLanguage: LanguageCode;
  originalText: string;
  startTime: number;
  endTime: number;
  status: SegmentStatus;
  createdAt: string;
}

export interface TranslationPublic {
  segmentId: string;
  language: LanguageCode;
  text: string;
  provider: string;
  status: SegmentStatus;
  latencyMs: number;
  isFallback?: boolean;
}

export interface VoiceSegmentPublic {
  segmentId: string;
  language: LanguageCode;
  provider: string;
  status: SegmentStatus;
  latencyMs: number;
  /** Present only when a server-side TTS provider produced a real audio asset. */
  audioUrl?: string | null;
  durationMs?: number | null;
}

export interface ChatMessagePublic {
  id: string;
  meetingCode: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}

export interface ProviderCapability {
  category: "asr" | "translation" | "tts" | "turn";
  configured: boolean;
  provider: string;
  detail: string;
  /** Documentation pointer for the operator. */
  envVars: string[];
}

export interface ProviderStatusResponse {
  providers: ProviderCapability[];
  languages: LanguageCode[];
  demoMode: boolean;
  serverTime: string;
}
