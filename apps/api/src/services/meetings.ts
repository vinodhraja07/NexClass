import bcrypt from "bcryptjs";
import type {
  LanguageCode,
  MeetingPublic,
  MeetingSettings,
  ParticipantPublic,
} from "@nexclass/shared";
import {
  MeetingModel,
  ParticipantModel,
  type MeetingDoc,
  type ParticipantDoc,
} from "../models/index";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateMeetingCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export async function createUniqueMeetingCode(): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = generateMeetingCode();
    const existing = await MeetingModel.findOne({ code });
    if (!existing) return code;
  }
  return `${generateMeetingCode()}${Date.now().toString(36).slice(-2).toUpperCase()}`;
}

export function toMeetingPublic(meeting: MeetingDoc): MeetingPublic {
  const settings: MeetingSettings = {
    passwordEnabled: Boolean(meeting.settings?.passwordEnabled),
    participantPermissions: {
      canUnmute: meeting.settings?.participantPermissions?.canUnmute ?? true,
      canShareScreen: meeting.settings?.participantPermissions?.canShareScreen ?? true,
      canChat: meeting.settings?.participantPermissions?.canChat ?? true,
    },
    defaultSpeakerLanguage:
      meeting.settings?.defaultSpeakerLanguage ?? meeting.speakerLanguage ?? "en",
    availableLanguages:
      meeting.settings?.availableLanguages?.length
        ? meeting.settings.availableLanguages
        : meeting.availableLanguages?.length
          ? meeting.availableLanguages
          : ["en"],
    captionsEnabledByDefault: meeting.settings?.captionsEnabledByDefault ?? true,
    voiceEnabledByDefault: meeting.settings?.voiceEnabledByDefault ?? false,
  };

  return {
    id: meeting.id!,
    code: meeting.code,
    title: meeting.title,
    hostId: meeting.hostId,
    hostName: meeting.hostName,
    status: meeting.status,
    speakerLanguage: meeting.speakerLanguage ?? "en",
    availableLanguages: settings.availableLanguages,
    settings,
    createdAt: meeting.createdAt ? new Date(meeting.createdAt).toISOString() : new Date().toISOString(),
    startedAt: meeting.startedAt ? new Date(meeting.startedAt).toISOString() : null,
    endedAt: meeting.endedAt ? new Date(meeting.endedAt).toISOString() : null,
  };
}

export function toParticipantPublic(participant: ParticipantDoc): ParticipantPublic {
  return {
    id: participant.id!,
    meetingCode: participant.meetingCode,
    displayName: participant.displayName,
    role: participant.role,
    preferredLanguage: participant.preferredLanguage,
    captionLanguage: participant.captionLanguage,
    voiceLanguage: participant.voiceLanguage,
    interfaceLanguage: participant.interfaceLanguage,
    audioEnabled: participant.audioEnabled,
    videoEnabled: participant.videoEnabled,
    screenSharing: participant.screenSharing,
    handRaised: participant.handRaised,
    joinedAt: new Date(participant.joinedAt ?? Date.now()).toISOString(),
    leftAt: participant.leftAt ? new Date(participant.leftAt).toISOString() : null,
    isSimulated: participant.isSimulated,
  };
}

export async function hashMeetingPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 8);
}

export async function verifyMeetingPassword(password: string, hash?: string): Promise<boolean> {
  if (!hash) return true;
  return bcrypt.compare(password, hash);
}

export async function findActiveParticipants(meetingCode: string): Promise<ParticipantDoc[]> {
  return ParticipantModel.find({ meetingCode, leftAt: null }).exec();
}

export function defaultAvailableLanguages(speakerLanguage: LanguageCode): LanguageCode[] {
  const all: LanguageCode[] = ["en", "ta", "hi", "bn", "mr", "or"];
  return all.includes(speakerLanguage) ? all : [...all, speakerLanguage];
}
