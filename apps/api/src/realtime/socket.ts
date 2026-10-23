import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import type { LanguageCode } from "@nexclass/shared";
import { env } from "../config/env";
import { verifyToken } from "../middleware/auth";
import {
  ChatMessageModel,
  MeetingModel,
  ParticipantModel,
  TranscriptSegmentModel,
  type MeetingDoc,
  type ParticipantDoc,
} from "../models/index";
import { toMeetingPublic, toParticipantPublic } from "../services/meetings";
import { processSegment } from "../services/captionPipeline";
import { SHARED_RESOURCES, translateUiBundle } from "@nexclass/shared";
import { getTranslationAdapter, getTtsAdapter } from "../services/providers";

export interface SocketIdentity {
  userId: string | null;
  participantId: string | null;
  name: string;
  role: "teacher" | "student";
  meetingCode: string | null;
}

const identities = new WeakMap<Socket, SocketIdentity>();

export interface MeetingSocket {
  data: Record<string, unknown>;
  join(room: string): Promise<void> | void;
  leave(room: string): Promise<void> | void;
  emit(event: string, payload?: unknown, ack?: (response: unknown) => void): void;
  to(room: string): { emit(event: string, payload?: unknown): void };
  on(event: string, handler: (...args: never[]) => void): void;
  server: { sockets: { sockets: Map<string, MeetingSocket> } };
}

function peerSockets(socket: MeetingSocket): MeetingSocket[] {
  return [...socket.server.sockets.sockets.values()];
}

function broadcast(socket: MeetingSocket, code: string, event: string, payload: unknown) {
  for (const candidate of peerSockets(socket)) {
    if (candidate.data.meetingCode === code) {
      candidate.emit(event, payload);
    }
  }
}

function roomName(code: string) {
  return `meeting:${code}`;
}

async function resolveMeeting(code: string): Promise<MeetingDoc | null> {
  return MeetingModel.findOne({ code: code.toUpperCase() });
}

async function resolveParticipant(
  meeting: MeetingDoc,
  identity: SocketIdentity,
  payload: {
    name?: string;
    language?: LanguageCode;
    captionLanguage?: LanguageCode;
    voiceLanguage?: LanguageCode;
  },
): Promise<ParticipantDoc> {
  const existing = identity.participantId
    ? await ParticipantModel.findById(identity.participantId)
    : identity.userId
      ? await ParticipantModel.findOne({
          meetingCode: meeting.code,
          leftAt: null,
          $or: [{ userId: identity.userId }, { id: identity.userId }, { _id: identity.userId }],
        })
      : null;

  if (existing) {
    const updated = await ParticipantModel.findOneAndUpdate(
      { id: existing.id } as Record<string, unknown>,
      {
        $set: {
          leftAt: null,
          displayName: payload.name ?? existing.displayName,
          preferredLanguage: payload.language ?? existing.preferredLanguage,
          captionLanguage: payload.captionLanguage ?? existing.captionLanguage,
          voiceLanguage: payload.voiceLanguage ?? existing.voiceLanguage,
          interfaceLanguage: payload.language ?? existing.interfaceLanguage,
        },
      },
      { new: true },
    );
    return updated ?? existing;
  }

  return ParticipantModel.create({
    meetingId: meeting.id!,
    meetingCode: meeting.code,
    userId: identity.userId,
    displayName: payload.name ?? identity.name ?? "Guest",
    role: identity.role,
    preferredLanguage: payload.language ?? "en",
    captionLanguage: payload.captionLanguage ?? payload.language ?? "en",
    voiceLanguage: payload.voiceLanguage ?? payload.language ?? "en",
    interfaceLanguage: payload.language ?? "en",
    audioEnabled: true,
    videoEnabled: false,
    screenSharing: false,
    handRaised: false,
    isSimulated: false,
    joinedAt: new Date(),
    leftAt: null,
  });
}

function providerStatusPayload() {
  return {
    translationConfigured: Boolean(getTranslationAdapter()),
    ttsConfigured: Boolean(getTtsAdapter()),
    stunServers: env.stunServers,
    turnConfigured: Boolean(env.turn),
  };
}

export function attachRealtime(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      // Development and test reflect the caller so local tooling can connect.
      // Production enforces the configured origin allowlist.
      origin: env.isProduction ? env.clientOrigin.split(",").map((o) => o.trim()) : true,
      credentials: true,
    },
    maxHttpBufferSize: 1e6,
  });

  io.use((socket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.query?.token as string | undefined);
    if (!token) {
      next(new Error("Authentication required."));
      return;
    }
    const payload = verifyToken(token);
    if (!payload) {
      next(new Error("Invalid session."));
      return;
    }
    identities.set(socket, {
      userId: payload.sub,
      participantId: null,
      name: payload.name,
      role: payload.role,
      meetingCode: null,
    });
    next();
  });

    io.on("connection", (socket) => {
    const identity = identities.get(socket);
    if (!identity) {
      socket.disconnect(true);
      return;
    }
    registerMeetingHandlers(socket as unknown as MeetingSocket, identity);
  });

  return io;
}

export function registerMeetingHandlers(socket: MeetingSocket, identity: SocketIdentity) {

    socket.on(
      "meeting:join",
      async (
        payload: {
          meetingCode: string;
          name?: string;
          language?: LanguageCode;
          captionLanguage?: LanguageCode;
          voiceLanguage?: LanguageCode;
        },
        ack?: (response: unknown) => void,
      ) => {
      try {
        const meeting = await resolveMeeting(payload.meetingCode ?? "");
        if (!meeting) {
            socket.emit("error:message", { code: "meeting_not_found", message: "Meeting not found." });
            ack?.({ ok: false, error: "Meeting not found." });
            return;
          }
          if (meeting.status === "ended") {
            socket.emit("error:message", { code: "meeting_ended", message: "This meeting has ended." });
            ack?.({ ok: false, error: "This meeting has ended." });
            return;
          }

          const participant = await resolveParticipant(meeting, identity, payload ?? {});
          identity.participantId = participant.id!;
          identity.meetingCode = meeting.code;
          identity.name = participant.displayName;
          identity.role = participant.role;

          await socket.join(roomName(meeting.code));
          socket.data.meetingCode = meeting.code;
          socket.data.participantId = participant.id;

          if (meeting.status === "scheduled") {
            await MeetingModel.findOneAndUpdate(
              { code: meeting.code },
              { $set: { status: "live", startedAt: new Date() } },
              { new: true },
            );
          }

          const participants = await ParticipantModel.find({
            meetingCode: meeting.code,
            leftAt: null,
          }).exec();

          const freshMeeting = (await resolveMeeting(meeting.code)) ?? meeting;
          socket.emit("meeting:joined", {
            participant: toParticipantPublic(participant),
            meeting: toMeetingPublic(freshMeeting),
            participants: participants.map(toParticipantPublic),
            providerStatus: providerStatusPayload(),
            labels: translateUiBundle(participant.interfaceLanguage),
          });
          ack?.({ ok: true, participantId: participant.id });

          socket.to(roomName(meeting.code)).emit("participant:joined", {
            participant: toParticipantPublic(participant),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Could not join the meeting.";
          socket.emit("error:message", { code: "join_failed", message });
          ack?.({ ok: false, error: message });
        }
      },
    );

    socket.on("meeting:leave", async () => {
      const code = socket.data.meetingCode as string | undefined;
      if (!code) return;
      const participantId = socket.data.participantId as string | undefined;
      if (participantId) {
        await ParticipantModel.updateMany(
          { id: participantId } as Record<string, unknown>,
          { $set: { leftAt: new Date() } },
        );
        socket.to(roomName(code)).emit("participant:left", { participantId });
      }
      await socket.leave(roomName(code));
    });

    socket.on(
      "media:state",
      async (payload: {
        audioEnabled?: boolean;
        videoEnabled?: boolean;
        screenSharing?: boolean;
        handRaised?: boolean;
      }) => {
        const code = socket.data.meetingCode as string | undefined;
        const participantId = socket.data.participantId as string | undefined;
        if (!code || !participantId) return;
        const updates: Record<string, unknown> = {};
        if (typeof payload?.audioEnabled === "boolean") updates.audioEnabled = payload.audioEnabled;
        if (typeof payload?.videoEnabled === "boolean") updates.videoEnabled = payload.videoEnabled;
        if (typeof payload?.screenSharing === "boolean") updates.screenSharing = payload.screenSharing;
        if (typeof payload?.handRaised === "boolean") updates.handRaised = payload.handRaised;
        const updated = await ParticipantModel.findOneAndUpdate(
          { id: participantId } as Record<string, unknown>,
          { $set: updates },
          { new: true },
        );
        if (updated) {
          broadcast(socket, code, "participant:updated", {
            participant: toParticipantPublic(updated),
          });
        }
      },
    );

    socket.on(
      "preferences:set",
      async (payload: {
        captionLanguage?: LanguageCode;
        voiceLanguage?: LanguageCode;
        interfaceLanguage?: LanguageCode;
      }) => {
        const code = socket.data.meetingCode as string | undefined;
        const participantId = socket.data.participantId as string | undefined;
        if (!code || !participantId) return;
        const updates: Record<string, unknown> = {};
        if (payload?.captionLanguage) updates.captionLanguage = payload.captionLanguage;
        if (payload?.voiceLanguage) updates.voiceLanguage = payload.voiceLanguage;
        if (payload?.interfaceLanguage) updates.interfaceLanguage = payload.interfaceLanguage;
        const updated = await ParticipantModel.findOneAndUpdate(
          { id: participantId } as Record<string, unknown>,
          { $set: updates },
          { new: true },
        );
        if (updated) {
          broadcast(socket, code, "participant:updated", {
            participant: toParticipantPublic(updated),
          });
          if (updated.interfaceLanguage) {
            socket.emit("room:labels", { labels: translateUiBundle(updated.interfaceLanguage) });
          }
        }
      },
    );

    /* ------------------------- WebRTC signalling ------------------------- */

    socket.on("webrtc:offer", (payload: { toId: string; sdp: unknown }) => {
      const target = peerSockets(socket).find(
        (candidate) => candidate.data.participantId === payload?.toId,
      );
      if (!target) return;
      target.emit("webrtc:offer", {
        fromId: socket.data.participantId,
        sdp: payload.sdp,
      });
    });

    socket.on("webrtc:answer", (payload: { toId: string; sdp: unknown }) => {
      const target = peerSockets(socket).find(
        (candidate) => candidate.data.participantId === payload?.toId,
      );
      if (!target) return;
      target.emit("webrtc:answer", {
        fromId: socket.data.participantId,
        sdp: payload.sdp,
      });
    });

    socket.on("webrtc:ice", (payload: { toId: string; candidate: unknown }) => {
      const target = peerSockets(socket).find(
        (candidate) => candidate.data.participantId === payload?.toId,
      );
      if (!target) return;
      target.emit("webrtc:ice", {
        fromId: socket.data.participantId,
        candidate: payload.candidate,
      });
    });

    /* ----------------------------- Captions ------------------------------ */

    socket.on(
      "caption:interim",
      (payload: { text: string; language?: LanguageCode }) => {
        const code = socket.data.meetingCode as string | undefined;
        if (!code) return;
        socket.to(roomName(code)).emit("caption:interim", {
          speakerId: socket.data.participantId,
          speakerName: identity.name,
          text: payload?.text ?? "",
          language: payload?.language ?? meetingLanguageOf(code) ?? "en",
        });
      },
    );

    socket.on(
      "caption:original",
      async (payload: {
        text: string;
        language?: LanguageCode;
        startTime?: number;
        endTime?: number;
      }) => {
        const code = socket.data.meetingCode as string | undefined;
        const participantId = socket.data.participantId as string | undefined;
        if (!code || !participantId) return;
        const text = (payload?.text ?? "").trim();
        if (!text) return;

        const meeting = await resolveMeeting(code);
        if (!meeting) return;

        const segment = await TranscriptSegmentModel.create({
          meetingId: meeting.id!,
          meetingCode: meeting.code,
          speakerId: participantId,
          speakerName: identity.name,
          originalLanguage: payload?.language ?? meeting.speakerLanguage ?? "en",
          originalText: text,
          startTime: payload?.startTime ?? Date.now(),
          endTime: payload?.endTime ?? Date.now(),
          status: "pending",
          protectedTerms: [],
        });

        const participants = await ParticipantModel.find({
          meetingCode: meeting.code,
          leftAt: null,
        }).exec();

        const captionLanguages = [
          ...new Set(participants.map((p) => p.captionLanguage)),
        ] as LanguageCode[];
        const voiceLanguages = [...new Set(participants.map((p) => p.voiceLanguage))] as LanguageCode[];

        broadcast(socket, code, "caption:segment", {
          segment: {
            id: segment.id!,
            speakerId: participantId,
            speakerName: identity.name,
            originalLanguage: segment.originalLanguage,
            originalText: segment.originalText,
            startTime: segment.startTime,
            endTime: segment.endTime,
            status: "processing",
            translations: {},
            voices: {},
            protectedTerms: [],
          },
        });

        try {
          const processed = await processSegment({
            meeting,
            segment,
            captionLanguages,
            voiceLanguages,
          });

          const translations: Record<string, unknown> = {};
          processed.translations.forEach((item) => {
            translations[item.language] = {
              text: item.text,
              provider: item.provider,
              status: item.status,
              latencyMs: item.latencyMs,
              error: item.error,
            };
          });
          const voices: Record<string, unknown> = {};
          processed.voices.forEach((item) => {
            voices[item.language] = {
              provider: item.provider,
              status: item.status,
              latencyMs: item.latencyMs,
              audioUrl: item.audioUrl,
              error: item.error,
            };
          });

          broadcast(socket, code, "caption:segment", {
            segment: {
              id: segment.id!,
              speakerId: participantId,
              speakerName: identity.name,
              originalLanguage: segment.originalLanguage,
              originalText: segment.originalText,
              startTime: segment.startTime,
              endTime: segment.endTime,
              status: "complete",
              translations,
              voices,
              protectedTerms: processed.protectedTerms,
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Caption processing failed.";
          broadcast(socket, code, "caption:segment", {
            segment: {
              id: segment.id!,
              speakerId: participantId,
              speakerName: identity.name,
              originalLanguage: segment.originalLanguage,
              originalText: segment.originalText,
              startTime: segment.startTime,
              endTime: segment.endTime,
              status: "failed",
              translations: {},
              voices: {},
              protectedTerms: [],
              error: message,
            },
          });
        }
      },
    );

    /* ------------------------------- Chat -------------------------------- */

    socket.on("chat:send", async (payload: { message: string }) => {
      const code = socket.data.meetingCode as string | undefined;
      const participantId = socket.data.participantId as string | undefined;
      const message = (payload?.message ?? "").trim().slice(0, 1000);
      if (!code || !participantId || !message) return;
      const saved = await ChatMessageModel.create({
        meetingId: (await resolveMeeting(code))?.id ?? code,
        meetingCode: code,
        senderId: participantId,
        senderName: identity.name,
        message,
      });
      broadcast(socket, code, "chat:message", {
        message: {
          id: saved.id!,
          meetingCode: saved.meetingCode,
          senderId: saved.senderId,
          senderName: saved.senderName,
          message: saved.message,
          createdAt: new Date(saved.createdAt ?? Date.now()).toISOString(),
        },
      });
    });

    /* ------------------- Shared classroom localization ------------------- */

    // The shared object is teacher-orchestrated: only the host may change what
    // the whole room sees, no matter what the surface radio-group allows.
    socket.on("room:resource:set", async (payload: { resourceId: string }) => {
      const code = socket.data.meetingCode as string | undefined;
      if (!code) return;
      if (identity.role !== "teacher") return;
      const resource = SHARED_RESOURCES.find((item) => item.id === payload?.resourceId);
      if (!resource) return;
      broadcast(socket, code, "room:resource", {
        resourceId: resource.id,
        resources: SHARED_RESOURCES,
        labelsByLanguage: Object.fromEntries(
          (["en", "ta", "hi", "bn", "mr", "or"] as LanguageCode[]).map((language) => [
            language,
            {
              [resource.labelKey]: translateUiBundle(language, [resource.labelKey])[resource.labelKey],
              [resource.descriptionKey]:
                translateUiBundle(language, [resource.descriptionKey])[resource.descriptionKey],
              [resource.instructionKey]:
                translateUiBundle(language, [resource.instructionKey])[resource.instructionKey],
            },
          ]),
        ),
      });
    });

    socket.on("disconnect", async () => {
      const code = socket.data.meetingCode as string | undefined;
      const participantId = socket.data.participantId as string | undefined;
      if (!code || !participantId) return;
      await ParticipantModel.updateMany(
        { id: participantId } as Record<string, unknown>,
        { $set: { leftAt: new Date() } },
      );
      socket.to(roomName(code)).emit("participant:left", { participantId });
    });
}

function meetingLanguageOf(code: string): LanguageCode | null {
  return null;
}
