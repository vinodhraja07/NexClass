import {
  DEMO_CHAT_SEED,
  DEMO_SEGMENTS,
  DEMO_STUDENTS,
  translateUiBundle,
  type ChatMessagePublic,
  type LanguageCode,
  type MeetingPublic,
  type ParticipantPublic,
} from "@nexclass/shared";
import type {
  CaptionSegmentPayload,
  ClientEventMap,
  ConnectionStatus,
  MeetingTransport,
  ServerEventMap,
} from "./transport";

const FALLBACK_VOICE = "google-translate-tts-fallback";
const BROWSER_VOICE = "browser-speech-synthesis";
const speechAudioCache = new Map<string, string>();

/**
 * Voice metadata for one demo language. When real fallback audio resolved
 * from the API the segment carries it as a data URL; otherwise the
 * implementation falls back to the browser voice exactly like the live
 * classroom would when no TTS provider is configured.
 */
function voicePayload(audioUrl: string | null, error?: string): CaptionSegmentPayload["voices"][LanguageCode] {
  if (audioUrl) {
    return {
      provider: FALLBACK_VOICE,
      status: "complete",
      latencyMs: 16,
      audioUrl,
    };
  }
  return {
    provider: BROWSER_VOICE,
    status: error ? "failed" : "complete",
    latencyMs: 9,
    audioUrl: null,
    error,
  };
}

async function fetchDemoSpeech(language: LanguageCode, text: string): Promise<string | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const cacheKey = `${language}:${trimmed}`;
  const cached = speechAudioCache.get(cacheKey);
  if (cached) return cached;
  try {
    const response = await fetch(
      `/api/demo/speech?lang=${encodeURIComponent(language)}&text=${encodeURIComponent(trimmed)}`,
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { audioUrl?: string };
    if (!data.audioUrl) return null;
    if (speechAudioCache.size > 200) {
      speechAudioCache.delete(speechAudioCache.keys().next().value as string);
    }
    speechAudioCache.set(cacheKey, data.audioUrl);
    return data.audioUrl;
  } catch {
    // API unreachable/offline - the browser voice takes over below.
    return null;
  }
}

/** Never let synthesis hold the demo hostage; ample timeout ensures regional fallback voices succeed. */
function raceRequest(promise: Promise<string | null>): Promise<string | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 7500)),
  ]);
}

/**
 * Demo transport - a fully local, deterministic stand-in for the live meeting
 * server. It exists so the classroom can be demonstrated (and evaluated)
 * without any external API key. Everything it emits is clearly labelled as
 * simulated inside the UI.
 */
export class DemoTransport implements MeetingTransport {
  readonly kind = "demo" as const;

  private handlers = new Map<string, Set<(payload: unknown) => void>>();
  private statusHandlers = new Set<(status: ConnectionStatus) => void>();
  private status: ConnectionStatus = "idle";
  private timers: number[] = [];
  /** Chat seeds follow their own schedule and must survive a pause. */
  private chatTimers: number[] = [];
  private index = 0;
  /** When the segment currently on screen was dispatched (pause may happen mid-slot). */
  private slotStartMs: number | null = null;
  /** Duration of the slot for the segment currently on screen. */
  private slotDurationMs: number | null = null;
  /** Remaining display time of the on-screen segment at the moment of a pause. */
  private resumeDelayMs: number | null = null;

  self: ParticipantPublic;
  meeting: MeetingPublic;
  students: ParticipantPublic[] = [];
  playing = false;

  constructor() {
    this.meeting = {
      id: "demo-meeting",
      code: "DEMO01",
      title: "Mechanics of Rotating Bodies - Live Session",
      hostId: "demo-teacher",
      hostName: "Dr. Meera Krishnan",
      status: "live",
      speakerLanguage: "en",
      availableLanguages: ["en", "ta", "hi", "bn", "mr", "or"],
      settings: {
        passwordEnabled: false,
        participantPermissions: { canUnmute: true, canShareScreen: true, canChat: true },
        defaultSpeakerLanguage: "en",
        availableLanguages: ["en", "ta", "hi", "bn", "mr", "or"],
        captionsEnabledByDefault: true,
        voiceEnabledByDefault: true,
      },
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
    };

    this.self = {
      id: "demo-teacher",
      meetingCode: "DEMO01",
      displayName: "Dr. Meera Krishnan",
      role: "teacher",
      preferredLanguage: "en",
      captionLanguage: "en",
      voiceLanguage: "en",
      interfaceLanguage: "en",
      audioEnabled: true,
      videoEnabled: true,
      screenSharing: false,
      handRaised: false,
      joinedAt: new Date().toISOString(),
      leftAt: null,
      isSimulated: false,
    };

    this.students = DEMO_STUDENTS.map((student) => ({
      id: student.id,
      meetingCode: "DEMO01",
      displayName: student.name,
      role: "student" as const,
      preferredLanguage: student.language,
      captionLanguage: student.captionLanguage,
      voiceLanguage: student.voiceLanguage,
      interfaceLanguage: student.language,
      audioEnabled: student.microphoneEnabled,
      videoEnabled: student.cameraEnabled,
      screenSharing: false,
      handRaised: false,
      joinedAt: new Date().toISOString(),
      leftAt: null,
      isSimulated: true,
    }));
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status;
    this.statusHandlers.forEach((handler) => handler(status));
  }

  private dispatch<E extends keyof ServerEventMap>(event: E, payload: ServerEventMap[E]) {
    this.handlers.get(event as string)?.forEach((handler) => handler(payload));
  }

  async connect() {
    this.setStatus("connecting");
    await new Promise((resolve) => setTimeout(resolve, 350));
    this.setStatus("connected");
    this.dispatch("meeting:joined", {
      participant: this.self,
      meeting: this.meeting,
      participants: [this.self, ...this.students],
      providerStatus: {
        // Honest at boot: translation is NOT a live AI provider here - the
        // captions come from prepared, hand-authored samples (each caption
        // card says so). The voice chip is real: the keyless fallback voice
        // endpoint on the API server synthesizes actual audio.
        translationConfigured: false,
        ttsConfigured: true,
        stunServers: [],
        turnConfigured: false,
      },
      labels: translateUiBundle(this.self.interfaceLanguage),
    });

    DEMO_CHAT_SEED.forEach((entry, chatIndex) => {
      const message: ChatMessagePublic = {
        id: `demo-chat-${chatIndex}`,
        meetingCode: "DEMO01",
        senderId: chatIndex === 1 ? "demo-teacher" : `sim-${chatIndex}`,
        senderName: entry.sender,
        message: entry.message,
        createdAt: new Date().toISOString(),
      };
      this.chatTimers.push(
        window.setTimeout(() => this.dispatch("chat:message", { message }), 900 + chatIndex * 1400),
      );
    });

    this.prewarmVoiceCache();
  }

  disconnect() {
    this.timers.forEach((timer) => window.clearTimeout(timer));
    this.timers = [];
    this.chatTimers.forEach((timer) => window.clearTimeout(timer));
    this.chatTimers = [];
    this.playing = false;
    this.setStatus("disconnected");
  }

  emit<E extends keyof ClientEventMap>(event: E, payload: ClientEventMap[E]) {
    if (event === "chat:send") {
      const text = ((payload as { message: string }).message ?? "").trim();
      if (!text) return; // A visible chat row is never created for an empty message.
      const message: ChatMessagePublic = {
        id: `demo-chat-${Date.now()}`,
        meetingCode: "DEMO01",
        senderId: this.self.id,
        senderName: this.self.displayName,
        message: text,
        createdAt: new Date().toISOString(),
      };
      this.dispatch("chat:message", { message });
    }
    if (event === "preferences:set") {
      const prefs = payload as {
        captionLanguage?: LanguageCode;
        voiceLanguage?: LanguageCode;
        interfaceLanguage?: LanguageCode;
      };
      this.self = {
        ...this.self,
        captionLanguage: prefs.captionLanguage ?? this.self.captionLanguage,
        voiceLanguage: prefs.voiceLanguage ?? this.self.voiceLanguage,
        interfaceLanguage: prefs.interfaceLanguage ?? this.self.interfaceLanguage,
      };
      this.dispatch("participant:updated", { participant: this.self });
      if (prefs.interfaceLanguage) {
        this.dispatch("room:labels", { labels: translateUiBundle(prefs.interfaceLanguage) });
      }
    }
    if (event === "room:resource:set") {
      this.setResource((payload as { resourceId: string }).resourceId);
    }
    if (event === "media:state") {
      const state = payload as {
        audioEnabled?: boolean;
        videoEnabled?: boolean;
        screenSharing?: boolean;
      };
      this.self = {
        ...this.self,
        audioEnabled: state.audioEnabled ?? this.self.audioEnabled,
        videoEnabled: state.videoEnabled ?? this.self.videoEnabled,
        screenSharing: state.screenSharing ?? this.self.screenSharing,
      };
      this.dispatch("participant:updated", { participant: this.self });
    }
  }

  on<E extends keyof ServerEventMap>(
    event: E,
    handler: (payload: ServerEventMap[E]) => void,
  ): () => void {
    const key = event as string;
    if (!this.handlers.has(key)) this.handlers.set(key, new Set());
    this.handlers.get(key)!.add(handler as (payload: unknown) => void);
    return () => {
      this.handlers.get(key)?.delete(handler as (payload: unknown) => void);
    };
  }

  getStatus() {
    return this.status;
  }

  onStatusChange(handler: (status: ConnectionStatus) => void) {
    this.statusHandlers.add(handler);
    handler(this.status);
    return () => this.statusHandlers.delete(handler);
  }

  /* ------------------------------ Demo controls ------------------------------ */

  /** Playback incarnation. Every play/restart invalidates callbacks still in flight. */
  private cycle = 0;

  startPlayback() {
    if (this.playing) return;
    this.playing = true;
    // A new play cycle invalidates any dispatch callback that was still
    // awaiting its speech prefetch when the previous cycle stopped, so a
    // pause/restart can never deliver the same caption segment twice.
    this.cycle += 1;
    // The first line appears almost immediately instead of after a full
    // caption slot, so pressing play feels instant - unless the lecture was
    // paused mid-sentence, in which case the interrupted line keeps the rest
    // of its slot and captions resume exactly where they were interrupted.
    const delay = Math.max(700, this.resumeDelayMs ?? 0);
    this.resumeDelayMs = null;
    this.scheduleNext(delay);
  }

  pausePlayback() {
    this.playing = false;
    if (this.slotStartMs !== null && this.slotDurationMs !== null) {
      const remaining = this.slotDurationMs - (Date.now() - this.slotStartMs);
      this.resumeDelayMs = Math.max(0, Math.min(remaining, this.slotDurationMs));
    }
    this.timers.forEach((timer) => window.clearTimeout(timer));
    this.timers = [];
  }

  resetPlayback() {
    this.pausePlayback();
    this.cycle += 1;
    this.index = 0;
    this.slotStartMs = null;
    this.slotDurationMs = null;
    this.resumeDelayMs = null;
  }

  private scheduleNext(delayMs?: number) {
    if (!this.playing) return;
    if (this.index >= DEMO_SEGMENTS.length) {
      this.timers.push(window.setTimeout(() => this.resetPlayback(), 2500));
      return;
    }
    const demoSegment = DEMO_SEGMENTS[this.index];
    const segmentId = `${demoSegment.id}-${Date.now()}`;
    const capturedIndex = this.index;
    const capturedCycle = this.cycle;

    // Prefetch the fallback voice for all six languages while the previous
    // segment is still on screen, so the audio is ready when this segment
    // is dispatched. Offline or unreachable answers degrade to null.
    const scheduledText: Partial<Record<LanguageCode, string>> = {
      en: demoSegment.originalText,
      ...(demoSegment.translations as Partial<Record<LanguageCode, string>>),
    };
    const prefetch = Promise.all(
      (["en", "ta", "hi", "bn", "mr", "or"] as LanguageCode[]).map((language) =>
        raceRequest(fetchDemoSpeech(language, scheduledText[language] ?? "")),
      ),
    );

    this.timers.push(
      window.setTimeout(
        () => {
          void (async () => {
            // Real keyless fallback voice (same as the live classroom): every
            // language becomes audible even where the browser has no voice. A
            // failed or offline request degrades to the browser voice instead
            // of silence, exactly like a real provider outage would.
            const audioUrls = await prefetch;

            // A replay/restart or pause during synthesis aborts this dispatch:
            // the guard covers both the segment position and the playback
            // incarnation, so a stale callback can never resurrect a caption
            // after a reset or duplicate it on a resumed cycle.
            if (!this.playing || this.cycle !== capturedCycle || this.index !== capturedIndex) return;

          const translations: CaptionSegmentPayload["translations"] = {};
          const voices: CaptionSegmentPayload["voices"] = {};
          translations.en = {
            text: demoSegment.originalText,
            provider: "prepared-sample",
            status: "complete",
            latencyMs: 12,
          };
          voices.en = voicePayload(audioUrls[0]);
          (["ta", "hi", "bn", "mr", "or"] as LanguageCode[]).forEach((language, position) => {
            const text = demoSegment.translations[language];
            translations[language] = {
              text: text ?? "",
              provider: "prepared-sample",
              status: text ? "complete" : "failed",
              latencyMs: 18,
              error: text ? undefined : "No prepared sample for this language.",
            };
            voices[language] = voicePayload(audioUrls[position + 1], text ? undefined : "No prepared sample for this language.");
          });

          const payload: CaptionSegmentPayload = {
            id: segmentId,
            speakerId: "demo-teacher",
            speakerName: demoSegment.speakerName,
            originalLanguage: "en",
            originalText: demoSegment.originalText,
            startTime: Date.now(),
            endTime: Date.now() + demoSegment.durationMs,
            status: "complete",
            translations,
            voices,
            protectedTerms: demoSegment.terms.map((termId) => ({
              termId,
              surface: demoSegment.originalText,
            })),
          };

            this.dispatch("caption:segment", { segment: payload });
            this.index += 1;
            this.slotStartMs = Date.now();
            this.slotDurationMs = demoSegment.durationMs;
            this.scheduleNext(demoSegment.durationMs);
          })();
        },
        delayMs ?? demoSegment.durationMs,
      ),
    );
  }

  /**
   * Warm the keyless voice cache for every prepared segment while the user
   * is still reading the demo page, so pressing play never waits on speech
   * synthesis. Requests are staggered to stay friendly to the endpoint.
   */
  prewarmVoiceCache() {
    DEMO_SEGMENTS.forEach((segment, segmentIndex) => {
      (["en", "ta", "hi", "bn", "mr", "or"] as LanguageCode[]).forEach((language, languageIndex) => {
        const text = language === "en" ? segment.originalText : segment.translations[language];
        const order = segmentIndex * 6 + languageIndex;
        window.setTimeout(() => {
          void fetchDemoSpeech(language, text ?? "");
        }, order * 350);
      });
    });
  }

  addStudent(student: (typeof DEMO_STUDENTS)[number]) {
    if (this.students.some((existing) => existing.id === student.id)) return;
    const participant: ParticipantPublic = {
      id: student.id,
      meetingCode: "DEMO01",
      displayName: student.name,
      role: "student",
      preferredLanguage: student.language,
      captionLanguage: student.captionLanguage,
      voiceLanguage: student.voiceLanguage,
      interfaceLanguage: student.language,
      audioEnabled: student.microphoneEnabled,
      videoEnabled: student.cameraEnabled,
      screenSharing: false,
      handRaised: false,
      joinedAt: new Date().toISOString(),
      leftAt: null,
      isSimulated: true,
    };
    this.students = [...this.students, participant];
    this.dispatch("participant:joined", { participant });
  }

  removeStudent(id: string) {
    const remaining = this.students.filter((student) => student.id !== id);
    if (remaining.length === this.students.length) return;
    this.students = remaining;
    this.dispatch("participant:left", { participantId: id });
  }

  setStudentLanguage(id: string, language: LanguageCode) {
    const student = this.students.find((item) => item.id === id);
    if (!student) return;
    const updated: ParticipantPublic = {
      ...student,
      captionLanguage: language,
      voiceLanguage: language,
      interfaceLanguage: language,
    };
    this.students = this.students.map((item) => (item.id === id ? updated : item));
    this.dispatch("participant:updated", { participant: updated });
  }

  setResource(resourceId: string) {
    const languages: LanguageCode[] = ["en", "ta", "hi", "bn", "mr", "or"];
    this.dispatch("room:resource", {
      resourceId,
      resources: [],
      labelsByLanguage: Object.fromEntries(
        languages.map((language) => [language, translateUiBundle(language)]),
      ),
    });
  }
}
