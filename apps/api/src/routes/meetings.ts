import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { LANGUAGES, type LanguageCode } from "@nexclass/shared";
import {
  ChatMessageModel,
  MeetingModel,
  ParticipantModel,
  TranslationSegmentModel,
  TranscriptSegmentModel,
  VoiceSegmentModel,
  type MeetingDoc,
} from "../models/index";
import { optionalAuth, requireAuth, signToken } from "../middleware/auth";
import { HttpError, validateBody } from "../middleware/errors";
import {
  createUniqueMeetingCode,
  defaultAvailableLanguages,
  hashMeetingPassword,
  toMeetingPublic,
  toParticipantPublic,
  verifyMeetingPassword,
} from "../services/meetings";
import { env } from "../config/env";

const router = Router();

const languageCodes = LANGUAGES.map((l) => l.code) as [LanguageCode, ...LanguageCode[]];

const createMeetingSchema = z.object({
  title: z.string().trim().min(3, "Give the meeting a title of at least 3 characters.").max(120),
  speakerLanguage: z.enum(languageCodes).default("en"),
  availableLanguages: z.array(z.enum(languageCodes)).optional(),
  password: z.string().min(4).max(64).optional(),
  participantPermissions: z
    .object({
      canUnmute: z.boolean().default(true),
      canShareScreen: z.boolean().default(true),
      canChat: z.boolean().default(true),
    })
    .partial()
    .optional(),
  captionsEnabledByDefault: z.boolean().default(true),
  voiceEnabledByDefault: z.boolean().default(false),
});

const joinMeetingSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(60),
  password: z.string().max(64).optional(),
  language: z.enum(languageCodes).optional(),
  captionLanguage: z.enum(languageCodes).optional(),
  voiceLanguage: z.enum(languageCodes).optional(),
});

const updateMeetingSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  speakerLanguage: z.enum(languageCodes).optional(),
  availableLanguages: z.array(z.enum(languageCodes)).optional(),
  captionsEnabledByDefault: z.boolean().optional(),
  voiceEnabledByDefault: z.boolean().optional(),
  participantPermissions: z
    .object({
      canUnmute: z.boolean(),
      canShareScreen: z.boolean(),
      canChat: z.boolean(),
    })
    .partial()
    .optional(),
});

const chatSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty.").max(1000),
});

async function findMeeting(code: string): Promise<MeetingDoc> {
  const meeting = await MeetingModel.findOne({ code: code.toUpperCase() });
  if (!meeting) throw new HttpError(404, "Meeting not found.", "meeting_not_found");
  return meeting;
}

async function requireParticipant(meetingCode: string, userId: string) {
  // The meeting host counts as a participant even before the REST join call.
  const meetingForRole = await MeetingModel.findOne({ code: meetingCode });
  if (meetingForRole && meetingForRole.hostId === userId) {
    const hostParticipant = await ParticipantModel.findOne({
      meetingCode,
      userId,
      leftAt: null,
    });
    if (hostParticipant) return hostParticipant;
    return {
      id: `host:${userId}`,
      meetingId: meetingForRole.id!,
      meetingCode,
      userId,
      displayName: meetingForRole.hostName,
      role: "teacher" as const,
      preferredLanguage: meetingForRole.speakerLanguage ?? "en",
      captionLanguage: meetingForRole.speakerLanguage ?? "en",
      voiceLanguage: meetingForRole.speakerLanguage ?? "en",
      interfaceLanguage: meetingForRole.speakerLanguage ?? "en",
      audioEnabled: true,
      videoEnabled: true,
      screenSharing: false,
      handRaised: false,
      isSimulated: false,
      joinedAt: meetingForRole.createdAt,
      leftAt: null,
    } satisfies import("../models/index.js").ParticipantDoc;
  }
  const participant = await ParticipantModel.findOne({
    meetingCode,
    leftAt: null,
    $or: [{ userId }, { id: userId }, { _id: userId }],
  });
  if (!participant) {
    throw new HttpError(403, "You are not a participant in this meeting.", "not_a_participant");
  }
  return participant;
}

async function requireHost(meeting: MeetingDoc, userId: string) {
  if (meeting.hostId !== userId) {
    throw new HttpError(403, "Only the meeting host can perform this action.", "host_only");
  }
}

/* --------------------------- Meeting CRUD --------------------------- */

router.get("/meetings", requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth!.sub;
    const hosted = await MeetingModel.find({ hostId: userId }).sort({ createdAt: -1 }).limit(25).exec();
    const joinedParticipants = await ParticipantModel.find({ userId }).exec();
    const joinedCodes = [...new Set(joinedParticipants.map((p) => p.meetingCode))];
    const joined = (
      await Promise.all(joinedCodes.map(async (code) => MeetingModel.findOne({ code })))
    ).filter((m): m is MeetingDoc => Boolean(m));
    res.json({
      hosted: hosted.map(toMeetingPublic),
      joined: joined.map(toMeetingPublic),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/meetings", requireAuth, async (req, res, next) => {
  try {
    if (req.auth!.role !== "teacher") {
      throw new HttpError(403, "Only teacher accounts can create meetings.", "teacher_only");
    }
    const body = req.body as z.infer<typeof createMeetingSchema>;
    const code = await createUniqueMeetingCode();
    const availableLanguages =
      body.availableLanguages?.length
        ? body.availableLanguages
        : defaultAvailableLanguages(body.speakerLanguage);
    const passwordEnabled = Boolean(body.password);
    const meeting = await MeetingModel.create({
      title: body.title,
      code,
      hostId: req.auth!.sub,
      hostName: req.auth!.name,
      status: "scheduled",
      speakerLanguage: body.speakerLanguage,
      availableLanguages,
      settings: {
        passwordEnabled,
        passwordHash: passwordEnabled ? await hashMeetingPassword(body.password!) : undefined,
        participantPermissions: {
          canUnmute: body.participantPermissions?.canUnmute ?? true,
          canShareScreen: body.participantPermissions?.canShareScreen ?? true,
          canChat: body.participantPermissions?.canChat ?? true,
        },
        defaultSpeakerLanguage: body.speakerLanguage,
        availableLanguages,
        captionsEnabledByDefault: body.captionsEnabledByDefault,
        voiceEnabledByDefault: body.voiceEnabledByDefault,
      },
    });
    res.status(201).json({ meeting: toMeetingPublic(meeting) });
  } catch (error) {
    next(error);
  }
});

router.get("/meetings/:code", optionalAuth, async (req, res, next) => {
  try {
    const meeting = await findMeeting(req.params.code);
    res.json({ meeting: toMeetingPublic(meeting) });
  } catch (error) {
    next(error);
  }
});

router.patch("/meetings/:code", requireAuth, validateBody(updateMeetingSchema), async (req, res, next) => {
  try {
    const meeting = await findMeeting(req.params.code);
    await requireHost(meeting, req.auth!.sub);
    const body = req.body as z.infer<typeof updateMeetingSchema>;
    const updates: Record<string, unknown> = {};
    if (body.title) updates.title = body.title;
    if (body.speakerLanguage) {
      updates.speakerLanguage = body.speakerLanguage;
      updates["settings.defaultSpeakerLanguage"] = body.speakerLanguage;
    }
    if (body.availableLanguages) {
      updates.availableLanguages = body.availableLanguages;
      updates["settings.availableLanguages"] = body.availableLanguages;
    }
    if (body.captionsEnabledByDefault !== undefined) {
      updates["settings.captionsEnabledByDefault"] = body.captionsEnabledByDefault;
    }
    if (body.voiceEnabledByDefault !== undefined) {
      updates["settings.voiceEnabledByDefault"] = body.voiceEnabledByDefault;
    }
    if (body.participantPermissions) {
      updates["settings.participantPermissions.canUnmute"] =
        body.participantPermissions.canUnmute ?? true;
      updates["settings.participantPermissions.canShareScreen"] =
        body.participantPermissions.canShareScreen ?? true;
      updates["settings.participantPermissions.canChat"] = body.participantPermissions.canChat ?? true;
    }
    const updated = await MeetingModel.findOneAndUpdate({ code: meeting.code }, updates, { new: true });
    res.json({ meeting: toMeetingPublic(updated ?? meeting) });
  } catch (error) {
    next(error);
  }
});

router.post("/meetings/:code/join", optionalAuth, validateBody(joinMeetingSchema), async (req, res, next) => {
  try {
    const meeting = await findMeeting(req.params.code);
    if (meeting.status === "ended") {
      throw new HttpError(410, "This meeting has already ended.", "meeting_ended");
    }
    const body = req.body as z.infer<typeof joinMeetingSchema>;
    if (meeting.settings?.passwordEnabled) {
      const valid = await verifyMeetingPassword(body.password ?? "", meeting.settings.passwordHash);
      if (!valid) {
        throw new HttpError(401, "The meeting password is incorrect.", "invalid_password");
      }
    }

    const auth = req.auth;
    const existing = auth
      ? await ParticipantModel.findOne({ meetingCode: meeting.code, userId: auth.sub })
      : null;

    if (existing && !existing.leftAt) {
      const updated = await ParticipantModel.findOneAndUpdate(
        { id: existing.id } as Record<string, unknown>,
        {
          $set: {
            leftAt: null,
            joinedAt: new Date(),
            displayName: body.name,
            captionLanguage: body.captionLanguage ?? existing.captionLanguage,
            voiceLanguage: body.voiceLanguage ?? existing.voiceLanguage,
            preferredLanguage: body.language ?? existing.preferredLanguage,
          },
        },
        { new: true },
      );
      const participant = updated ?? existing;
      res.json({
        meeting: toMeetingPublic(meeting),
        participant: toParticipantPublic(participant),
        token: signToken({
          sub: auth?.sub ?? participant.id!,
          email: auth?.email ?? `guest-${participant.id}@local`,
          name: participant.displayName,
          role: participant.role,
        }),
      });
      return;
    }

    const isGuest = !auth;
    if (isGuest && !env.allowGuestJoin) {
      throw new HttpError(401, "Sign in to join this meeting.", "login_required");
    }

    const participant = await ParticipantModel.create({
      meetingId: meeting.id!,
      meetingCode: meeting.code,
      userId: auth?.sub ?? null,
      displayName: body.name,
      role: auth?.role ?? "student",
      preferredLanguage: body.language ?? "en",
      captionLanguage: body.captionLanguage ?? body.language ?? "en",
      voiceLanguage: body.voiceLanguage ?? body.language ?? "en",
      interfaceLanguage: body.language ?? "en",
      audioEnabled: true,
      videoEnabled: false,
      screenSharing: false,
      handRaised: false,
      isSimulated: false,
      joinedAt: new Date(),
      leftAt: null,
    });

    const token = auth
      ? signToken({ sub: auth.sub, email: auth.email, name: participant.displayName, role: participant.role })
      : signToken({
          sub: participant.id!,
          email: `guest-${participant.id}@local`,
          name: participant.displayName,
          role: "student",
        });

    if (meeting.status === "scheduled") {
      await MeetingModel.findOneAndUpdate(
        { code: meeting.code },
        { $set: { status: "live", startedAt: new Date() } },
        { new: true },
      );
    }

    res.status(201).json({
      meeting: toMeetingPublic(meeting),
      participant: toParticipantPublic(participant),
      token,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/meetings/:code/leave", requireAuth, async (req, res, next) => {
  try {
    const meeting = await findMeeting(req.params.code);
    const participant = await ParticipantModel.findOne({
      meetingCode: meeting.code,
      leftAt: null,
      $or: [{ userId: req.auth!.sub }, { id: req.auth!.sub }, { _id: req.auth!.sub }],
    });
    if (!participant) {
      res.json({ ok: true });
      return;
    }
    await ParticipantModel.updateMany(
      { id: participant.id } as Record<string, unknown>,
      { $set: { leftAt: new Date() } },
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.post("/meetings/:code/end", requireAuth, async (req, res, next) => {
  try {
    const meeting = await findMeeting(req.params.code);
    await requireHost(meeting, req.auth!.sub);
    const updated = await MeetingModel.findOneAndUpdate(
      { code: meeting.code },
      { $set: { status: "ended", endedAt: new Date() } },
      { new: true },
    );
    await ParticipantModel.updateMany(
      { meetingCode: meeting.code, leftAt: null },
      { $set: { leftAt: new Date() } },
    );
    res.json({ meeting: toMeetingPublic(updated ?? meeting) });
  } catch (error) {
    next(error);
  }
});

router.get("/meetings/:code/participants", requireAuth, async (req, res, next) => {
  try {
    const meeting = await findMeeting(req.params.code);
    await requireParticipant(meeting.code, req.auth!.sub);
    const participants = await ParticipantModel.find({ meetingCode: meeting.code }).exec();
    res.json({ participants: participants.map(toParticipantPublic) });
  } catch (error) {
    next(error);
  }
});

router.get("/meetings/:code/chat", requireAuth, async (req, res, next) => {
  try {
    const meeting = await findMeeting(req.params.code);
    await requireParticipant(meeting.code, req.auth!.sub);
    const messages = await ChatMessageModel.find({ meetingCode: meeting.code })
      .sort({ createdAt: 1 })
      .limit(300)
      .exec();
    res.json({
      messages: messages.map((m) => ({
        id: m.id!,
        meetingCode: m.meetingCode,
        senderId: m.senderId,
        senderName: m.senderName,
        message: m.message,
        createdAt: new Date(m.createdAt ?? Date.now()).toISOString(),
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/meetings/:code/chat", requireAuth, validateBody(chatSchema), async (req, res, next) => {
  try {
    const meeting = await findMeeting(req.params.code);
    const participant = await requireParticipant(meeting.code, req.auth!.sub);
    if (meeting.settings?.participantPermissions?.canChat === false && participant.role !== "teacher") {
      throw new HttpError(403, "Chat is disabled for this meeting.", "chat_disabled");
    }
    const { message } = req.body as z.infer<typeof chatSchema>;
    const saved = await ChatMessageModel.create({
      meetingId: meeting.id!,
      meetingCode: meeting.code,
      senderId: participant.id!,
      senderName: participant.displayName,
      message,
    });
    res.status(201).json({
      message: {
        id: saved.id!,
        meetingCode: saved.meetingCode,
        senderId: saved.senderId,
        senderName: saved.senderName,
        message: saved.message,
        createdAt: new Date(saved.createdAt ?? Date.now()).toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/meetings/:code/transcripts", requireAuth, async (req, res, next) => {
  try {
    const meeting = await findMeeting(req.params.code);
    await requireParticipant(meeting.code, req.auth!.sub);
    const limit = Math.min(Number(req.query.limit ?? 200), 500);
    const segments = await TranscriptSegmentModel.find({ meetingCode: meeting.code })
      .sort({ createdAt: 1 })
      .limit(limit)
      .exec();
    res.json({
      segments: segments.map((segment) => ({
        id: segment.id!,
        meetingId: segment.meetingId,
        meetingCode: segment.meetingCode,
        speakerId: segment.speakerId,
        speakerName: segment.speakerName,
        originalLanguage: segment.originalLanguage,
        originalText: segment.originalText,
        startTime: segment.startTime,
        endTime: segment.endTime,
        status: segment.status,
        createdAt: new Date(segment.createdAt ?? Date.now()).toISOString(),
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/meetings/:code/translations", requireAuth, async (req, res, next) => {
  try {
    const meeting = await findMeeting(req.params.code);
    await requireParticipant(meeting.code, req.auth!.sub);
    const translations = await TranslationSegmentModel.find({ meetingId: meeting.id }).exec();
    res.json({
      translations: translations.map((t) => ({
        segmentId: t.segmentId,
        language: t.language,
        text: t.text,
        provider: t.provider,
        status: t.status,
        latencyMs: t.latencyMs,
        isFallback: t.isFallback,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/meetings/:code/voices", requireAuth, async (req, res, next) => {
  try {
    const meeting = await findMeeting(req.params.code);
    await requireParticipant(meeting.code, req.auth!.sub);
    const voices = await VoiceSegmentModel.find({ meetingId: meeting.id }).exec();
    res.json({
      voices: voices.map((v) => ({
        segmentId: v.segmentId,
        language: v.language,
        provider: v.provider,
        status: v.status,
        latencyMs: v.latencyMs,
        audioUrl: v.audioUrl ?? null,
        durationMs: v.durationMs ?? null,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/** Update the language preferences of the signed-in participant. */
router.patch("/meetings/:code/preferences", requireAuth, async (req, res, next) => {
  try {
    const meeting = await findMeeting(req.params.code);
    const participant = await requireParticipant(meeting.code, req.auth!.sub);
    const schema = z.object({
      captionLanguage: z.enum(languageCodes).optional(),
      voiceLanguage: z.enum(languageCodes).optional(),
      interfaceLanguage: z.enum(languageCodes).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Invalid language preference.", "validation_error");
    }
    const updated = await ParticipantModel.findOneAndUpdate(
      { id: participant.id } as Record<string, unknown>,
      { $set: parsed.data },
      { new: true },
    );
    res.json({ participant: toParticipantPublic(updated ?? participant) });
  } catch (error) {
    next(error);
  }
});

export default router;
