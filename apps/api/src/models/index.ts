import mongoose, { Schema } from "mongoose";
import type { LanguageCode, MeetingStatus, ParticipantRole, SegmentStatus } from "@nexclass/shared";
import { registerModel } from "../db/model";

export interface UserDoc {
  id?: string;
  name: string;
  email: string;
  passwordHash: string;
  role: ParticipantRole;
  preferredLanguage: LanguageCode;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeetingDoc {
  id?: string;
  title: string;
  code: string;
  hostId: string;
  hostName: string;
  status: MeetingStatus;
  speakerLanguage: LanguageCode;
  availableLanguages: LanguageCode[];
  settings: {
    passwordEnabled: boolean;
    passwordHash?: string;
    participantPermissions: {
      canUnmute: boolean;
      canShareScreen: boolean;
      canChat: boolean;
    };
    defaultSpeakerLanguage: LanguageCode;
    availableLanguages: LanguageCode[];
    captionsEnabledByDefault: boolean;
    voiceEnabledByDefault: boolean;
  };
  createdAt: Date;
  startedAt?: Date | null;
  endedAt?: Date | null;
}

export interface ParticipantDoc {
  id?: string;
  meetingId: string;
  meetingCode: string;
  userId?: string | null;
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
  isSimulated: boolean;
  joinedAt: Date;
  leftAt?: Date | null;
}

export interface TranscriptSegmentDoc {
  id?: string;
  meetingId: string;
  meetingCode: string;
  speakerId: string;
  speakerName: string;
  originalLanguage: LanguageCode;
  originalText: string;
  startTime: number;
  endTime: number;
  status: SegmentStatus;
  protectedTerms: { termId: string; surface: string }[];
  createdAt: Date;
}

export interface TranslationSegmentDoc {
  id?: string;
  meetingId: string;
  segmentId: string;
  language: LanguageCode;
  text: string;
  provider: string;
  status: SegmentStatus;
  latencyMs: number;
  isFallback: boolean;
  createdAt: Date;
}

export interface VoiceSegmentDoc {
  id?: string;
  meetingId: string;
  segmentId: string;
  language: LanguageCode;
  provider: string;
  status: SegmentStatus;
  latencyMs: number;
  audioUrl?: string | null;
  durationMs?: number | null;
  createdAt: Date;
}

export interface ChatMessageDoc {
  id?: string;
  meetingId: string;
  meetingCode: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: Date;
}

const languageEnum = ["en", "ta", "hi", "bn", "mr", "or"];

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["teacher", "student"], default: "student" },
    preferredLanguage: { type: String, enum: languageEnum, default: "en" },
  },
  { timestamps: true },
);

const meetingSchema = new Schema<MeetingDoc>(
  {
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, index: true },
    hostId: { type: String, required: true },
    hostName: { type: String, required: true },
    status: { type: String, enum: ["scheduled", "live", "ended"], default: "scheduled" },
    speakerLanguage: { type: String, enum: languageEnum, default: "en" },
    availableLanguages: { type: [String], default: ["en"] },
    settings: {
      passwordEnabled: { type: Boolean, default: false },
      passwordHash: { type: String },
      participantPermissions: {
        canUnmute: { type: Boolean, default: true },
        canShareScreen: { type: Boolean, default: true },
        canChat: { type: Boolean, default: true },
      },
      defaultSpeakerLanguage: { type: String, enum: languageEnum, default: "en" },
      availableLanguages: { type: [String], default: ["en"] },
      captionsEnabledByDefault: { type: Boolean, default: true },
      voiceEnabledByDefault: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

const participantSchema = new Schema<ParticipantDoc>(
  {
    meetingId: { type: String, required: true, index: true },
    meetingCode: { type: String, required: true, index: true },
    userId: { type: String, default: null },
    displayName: { type: String, required: true },
    role: { type: String, enum: ["teacher", "student"], default: "student" },
    preferredLanguage: { type: String, enum: languageEnum, default: "en" },
    captionLanguage: { type: String, enum: languageEnum, default: "en" },
    voiceLanguage: { type: String, enum: languageEnum, default: "en" },
    interfaceLanguage: { type: String, enum: languageEnum, default: "en" },
    audioEnabled: { type: Boolean, default: true },
    videoEnabled: { type: Boolean, default: true },
    screenSharing: { type: Boolean, default: false },
    handRaised: { type: Boolean, default: false },
    isSimulated: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date, default: null },
  },
  { timestamps: false },
);

const protectedTermSchema = new mongoose.Schema<{ termId: string; surface: string }>(
  {
    termId: { type: String, required: true },
    surface: { type: String, required: true },
  },
  { _id: false },
);

const transcriptSegmentSchema = new Schema<TranscriptSegmentDoc>(
  {
    meetingId: { type: String, required: true, index: true },
    meetingCode: { type: String, required: true, index: true },
    speakerId: { type: String, required: true },
    speakerName: { type: String, required: true },
    originalLanguage: { type: String, enum: languageEnum, default: "en" },
    originalText: { type: String, required: true },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    status: { type: String, enum: ["pending", "processing", "complete", "failed"], default: "pending" },
    protectedTerms: { type: [protectedTermSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const translationSegmentSchema = new Schema<TranslationSegmentDoc>(
  {
    meetingId: { type: String, required: true, index: true },
    segmentId: { type: String, required: true, index: true },
    language: { type: String, enum: languageEnum, required: true },
    text: { type: String, default: "" },
    provider: { type: String, required: true },
    status: { type: String, enum: ["pending", "processing", "complete", "failed"], default: "pending" },
    latencyMs: { type: Number, default: 0 },
    isFallback: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const voiceSegmentSchema = new Schema<VoiceSegmentDoc>(
  {
    meetingId: { type: String, required: true, index: true },
    segmentId: { type: String, required: true, index: true },
    language: { type: String, enum: languageEnum, required: true },
    provider: { type: String, required: true },
    status: { type: String, enum: ["pending", "processing", "complete", "failed"], default: "pending" },
    latencyMs: { type: Number, default: 0 },
    audioUrl: { type: String, default: null },
    durationMs: { type: Number, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const chatMessageSchema = new Schema<ChatMessageDoc>(
  {
    meetingId: { type: String, required: true, index: true },
    meetingCode: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const UserModel = registerModel<UserDoc>("User", userSchema, () => ({
  name: "",
  email: "",
  passwordHash: "",
  role: "student",
  preferredLanguage: "en",
  createdAt: new Date(),
  updatedAt: new Date(),
}));

export const MeetingModel = registerModel<MeetingDoc>("Meeting", meetingSchema, () => ({
  title: "",
  code: "",
  hostId: "",
  hostName: "",
  status: "scheduled",
  speakerLanguage: "en",
  availableLanguages: ["en"],
  settings: {
    passwordEnabled: false,
    participantPermissions: { canUnmute: true, canShareScreen: true, canChat: true },
    defaultSpeakerLanguage: "en",
    availableLanguages: ["en"],
    captionsEnabledByDefault: true,
    voiceEnabledByDefault: false,
  },
  createdAt: new Date(),
}));

export const ParticipantModel = registerModel<ParticipantDoc>("Participant", participantSchema, () => ({
  meetingId: "",
  meetingCode: "",
  displayName: "",
  role: "student",
  preferredLanguage: "en",
  captionLanguage: "en",
  voiceLanguage: "en",
  interfaceLanguage: "en",
  audioEnabled: true,
  videoEnabled: true,
  screenSharing: false,
  handRaised: false,
  isSimulated: false,
  joinedAt: new Date(),
}));

export const TranscriptSegmentModel = registerModel<TranscriptSegmentDoc>(
  "TranscriptSegment",
  transcriptSegmentSchema,
  () => ({
    meetingId: "",
    meetingCode: "",
    speakerId: "",
    speakerName: "",
    originalLanguage: "en",
    originalText: "",
    startTime: 0,
    endTime: 0,
    status: "pending",
    protectedTerms: [],
    createdAt: new Date(),
  }),
);

export const TranslationSegmentModel = registerModel<TranslationSegmentDoc>(
  "TranslationSegment",
  translationSegmentSchema,
  () => ({
    meetingId: "",
    segmentId: "",
    language: "en",
    text: "",
    provider: "none",
    status: "pending",
    latencyMs: 0,
    isFallback: false,
    createdAt: new Date(),
  }),
);

export const VoiceSegmentModel = registerModel<VoiceSegmentDoc>(
  "VoiceSegment",
  voiceSegmentSchema,
  () => ({
    meetingId: "",
    segmentId: "",
    language: "en",
    provider: "none",
    status: "pending",
    latencyMs: 0,
    audioUrl: null,
    durationMs: null,
    createdAt: new Date(),
  }),
);

export const ChatMessageModel = registerModel<ChatMessageDoc>("ChatMessage", chatMessageSchema, () => ({
  meetingId: "",
  meetingCode: "",
  senderId: "",
  senderName: "",
  message: "",
  createdAt: new Date(),
}));

export {
  RecordingModel,
  toRecordingPublic,
  type RecordingDoc,
  type RecordingPublic,
} from "./recording";

