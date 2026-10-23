import { afterAll, describe, expect, it } from "vitest";
import type http from "node:http";
import { default as request } from "supertest";

// Server voice synthesis is disabled for tests: the keyless fallback TTS
// needs internet access and this sandbox refuses outbound calls. Outside
// tests TTS_PROVIDER defaults to the keyless fallback voice
// (google-translate-tts-fallback), so every language stays audible.
process.env.TTS_PROVIDER = "none";

async function getTestApp() {
  const { createApp } = await import("../src/app.js");
  return createApp();
}

/* ------------------------------------------------------------------ *
 * Unit: terminology engine
 * ------------------------------------------------------------------ */

describe("terminology engine", () => {
  it("protects technical terms with opaque placeholders", async () => {
    const { protectTerms } = await import("@nexclass/terminology");
    const source = "The eigenvalue of the matrix and the angular velocity both matter.";
    const result = protectTerms(source);
    expect(result.terms.length).toBeGreaterThanOrEqual(2);
    expect(result.text).not.toContain("eigenvalue");
    expect(result.text).not.toContain("angular velocity");
    expect(result.text).toContain("\uE000");
  });

  it("restores terms with a localised equivalent while keeping the original", async () => {
    const { protectTerms, restoreTerms } = await import("@nexclass/terminology");
    const source = "The torque acting on this rotating body changes with angular acceleration.";
    const protectedText = protectTerms(source);
    const restored = restoreTerms(protectedText.text, protectedText.terms, "ta");
    expect(restored.restored.length).toBeGreaterThanOrEqual(2);
    expect(restored.text).toContain("(torque)");
    expect(restored.text).toContain("(angular acceleration)");
  });

  it("falls back to the original term when the translator drops the placeholder", async () => {
    const { protectTerms, restoreTerms } = await import("@nexclass/terminology");
    const protectedText = protectTerms("The eigenvector is important.");
    // Simulate a translation engine that stripped the private-use markers.
    const translated = protectedText.text.replace(/[\uE000-\uF8FF0-9]+/g, "");
    const restored = restoreTerms(translated, protectedText.terms, "hi");
    expect(restored.text).toContain("eigenvector");
  });

  it("uses a verified localised equivalent when one is available", async () => {
    const { protectTerms, restoreTerms } = await import("@nexclass/terminology");
    const protectedText = protectTerms("The acceleration increases quickly.");
    const restored = restoreTerms(protectedText.text, protectedText.terms, "ta");
    expect(restored.restored.length).toBeGreaterThanOrEqual(1);
    // conserveOriginal: the English term stays visible next to à®®à¯à®Ÿà®•à¯à®•à®®à¯.
    expect(restored.text).toContain("acceleration");
  });
});

/* ------------------------------------------------------------------ *
 * Unit: meeting codes
 * ------------------------------------------------------------------ */

describe("meeting codes", () => {
  it("exclude ambiguous characters", async () => {
    const { generateMeetingCode } = await import("../src/services/meetings.js");
    for (const code of Array.from({ length: 200 }, () => generateMeetingCode())) {
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
      expect(code).not.toContain("0");
      expect(code).not.toContain("O");
      expect(code).not.toContain("1");
      expect(code).not.toContain("I");
    }
  });
});

/* ------------------------------------------------------------------ *
 * REST API integration (in-memory store, no external services)
 * ------------------------------------------------------------------ */

describe("nexclass REST API", () => {
  let teacherToken = "";
  let studentToken = "";
  let meetingCode = "";

  it("registers a teacher and a student and returns tokens", async () => {
    const app = await getTestApp();

    const teacher = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Meera",
        email: "teacher.test@nexclass.local",
        password: "Passw0rd!Class",
        role: "teacher",
        preferredLanguage: "en",
      });
    expect(teacher.status).toBe(201);
    expect(teacher.body.token).toBeTruthy();
    teacherToken = teacher.body.token;

    const student = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Arjun",
        email: "student.test@nexclass.local",
        password: "StuPass!123x",
        role: "student",
        preferredLanguage: "hi",
      });
    expect(student.status).toBe(201);
    studentToken = student.body.token;
  });

  it("rejects duplicate registration with a friendly code", async () => {
    const app = await getTestApp();
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Meera",
        email: "teacher.test@nexclass.local",
        password: "Passw0rd!Class",
        role: "teacher",
        preferredLanguage: "en",
      });
    expect(response.status).toBe(409);
    expect(response.body.code).toBe("email_taken");
  });

  it("validates registration payloads", async () => {
    const app = await getTestApp();
    const response = await request(app)
      .post("/api/auth/register")
      .send({ name: "S", email: "not-an-email", password: "123", role: "teacher" });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe("validation_error");
  });

  it("logs in with correct credentials and refuses wrong ones", async () => {
    const app = await getTestApp();
    const good = await request(app)
      .post("/api/auth/login")
      .send({ email: "teacher.test@nexclass.local", password: "Passw0rd!Class" });
    expect(good.status).toBe(200);
    expect(good.body.user.role).toBe("teacher");

    const bad = await request(app)
      .post("/api/auth/login")
      .send({ email: "teacher.test@nexclass.local", password: "wrong-password" });
    expect(bad.status).toBe(401);
  });

  it("asks for authentication for protected routes", async () => {
    const app = await getTestApp();
    const response = await request(app).get("/api/auth/me");
    expect(response.status).toBe(401);
  });

  it("creates meetings for teachers only and returns a shareable code", async () => {
    const app = await getTestApp();

    const forbidden = await request(app)
      .post("/api/meetings")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ title: "Student meeting", speakerLanguage: "en" });
    expect(forbidden.status).toBe(403);

    const unauthenticated = await request(app).post("/api/meetings").send({ title: "X" });
    expect(unauthenticated.status).toBe(401);

    const created = await request(app)
      .post("/api/meetings")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({
        title: "Rotating Bodies 101",
        speakerLanguage: "en",
        availableLanguages: ["en", "ta", "hi", "bn", "mr", "or"],
      });
    expect(created.status).toBe(201);
    meetingCode = created.body.meeting.code;
    expect(meetingCode).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    expect(created.body.meeting.availableLanguages).toContain("ta");
  });

  it("lets a guest join by code without an account", async () => {
    const app = await getTestApp();
    const response = await request(app)
      .post(`/api/meetings/${meetingCode}/join`)
      .send({ name: "Kavya", language: "ta" });
    expect(response.status).toBe(201);
    expect(response.body.participant.role).toBe("student");
    expect(response.body.participant.captionLanguage).toBe("ta");
    expect(response.body.token).toBeTruthy();
  });

  it("keeps participant language choices isolated per participant", async () => {
    const app = await getTestApp();
    await request(app)
      .post(`/api/meetings/${meetingCode}/join`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ name: "Arjun", language: "hi", captionLanguage: "hi", voiceLanguage: "hi" });

    const participants = await request(app)
      .get(`/api/meetings/${meetingCode}/participants`)
      .set("Authorization", `Bearer ${teacherToken}`);
    expect(participants.status).toBe(200);
    const capLanguages = participants.body.participants.map(
      (participant: { captionLanguage: string }) => participant.captionLanguage,
    );
    expect(capLanguages).toContain("ta");
    expect(capLanguages).toContain("hi");
  });

  it("requires an authenticated participant to read the participant list", async () => {
    const app = await getTestApp();
    const response = await request(app).get(`/api/meetings/${meetingCode}/participants`);
    expect(response.status).toBe(401);
  });

  it("hides host-only controls from students", async () => {
    const app = await getTestApp();
    const response = await request(app)
      .post(`/api/meetings/${meetingCode}/end`)
      .set("Authorization", `Bearer ${studentToken}`);
    expect(response.status).toBe(403);
    expect(response.body.code).toBe("host_only");
  });

  it("updates a participant's language preferences independently", async () => {
    const app = await getTestApp();
    const updated = await request(app)
      .patch(`/api/meetings/${meetingCode}/preferences`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ captionLanguage: "mr" });
    expect(updated.status).toBe(200);
    expect(updated.body.participant.captionLanguage).toBe("mr");
  });

  it("supports chat inside the meeting", async () => {
    const app = await getTestApp();
    const sent = await request(app)
      .post(`/api/meetings/${meetingCode}/chat`)
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ message: "Welcome to the live class." });
    expect(sent.status).toBe(201);
    const history = await request(app)
      .get(`/api/meetings/${meetingCode}/chat`)
      .set("Authorization", `Bearer ${teacherToken}`);
    expect(history.status).toBe(200);
    expect(history.body.messages.at(-1).message).toBe("Welcome to the live class.");
  });

  it("reports provider configuration truthfully", async () => {
    const app = await getTestApp();
    const status = await request(app).get("/api/providers/status");
    expect(status.status).toBe(200);
    const translation = status.body.providers.find(
      (provider: { category: string }) => provider.category === "translation",
    );
    const tts = status.body.providers.find(
      (provider: { category: string }) => provider.category === "tts",
    );
    // Every translation provider requires real credentials; the factory has none.
    expect(translation.configured).toBe(false);
    // Tests set TTS_PROVIDER=none (outbound calls are blocked in the sandbox),
    // so server voice synthesis is off and clients use their browser voice.
    // Outside tests the keyless fallback voice is configured by default.
    expect(tts.configured).toBe(false);
    expect(tts.provider).toBe("none");
  });

  it("lists prepared demo segments labelled as simulated", async () => {
    const app = await getTestApp();
    const response = await request(app).get("/api/demo/segments");
    expect(response.status).toBe(200);
    expect(response.body.simulated).toBe(true);
    expect(response.body.segments.length).toBeGreaterThan(0);
  });

  it("validates demo voice requests before synthesizing", async () => {
    const app = await getTestApp();
    const unsupported = await request(app).get("/api/demo/speech?lang=zz&text=hello");
    expect(unsupported.status).toBe(400);
    expect(unsupported.body.error).toBe("unsupported_language");
    const empty = await request(app).get("/api/demo/speech?lang=ta&text=%20");
    expect(empty.status).toBe(400);
    expect(empty.body.error).toBe("invalid_text");
    const long = await request(app).get(`/api/demo/speech?lang=ta&text=${"x".repeat(601)}`);
    expect(long.status).toBe(400);
    expect(long.body.error).toBe("invalid_text");
  });

  it("ends the meeting only for the host and refuses late joiners", async () => {
    const app = await getTestApp();
    const ended = await request(app)
      .post(`/api/meetings/${meetingCode}/end`)
      .set("Authorization", `Bearer ${teacherToken}`);
    expect(ended.status).toBe(200);
    expect(ended.body.meeting.status).toBe("ended");

    const late = await request(app)
      .post(`/api/meetings/${meetingCode}/join`)
      .send({ name: "Late Guest" });
    expect(late.status).toBe(410);
  });
});

/* ------------------------------------------------------------------ *
 * Realtime meeting handlers (caption pipeline + signalling).
 *
 * The sandbox blocks outbound loopback sockets (engine.io polling and
 * websocket transports both fail), so the live Socket.IO layer cannot be
 * network-tested here. The handlers were extracted from the connection
 * callback so they run against socket doubles, which exercises the whole
 * meeting flow: join -> participant signalling -> caption pipeline ->
 * translated/voice statuses -> chat -> WebRTC relay.
 * ------------------------------------------------------------------ */

type FakeEmitRecord = { event: string; args: unknown[] };

interface FakeHandlers {
  socket: import("../src/realtime/socket.js").MeetingSocket;
  handlers: Map<string, Array<(...args: never[]) => void>>;
  sent: FakeEmitRecord[];
  id: string;
}

function makeFakeSocket(id: string, shared: Map<string, import("../src/realtime/socket.js").MeetingSocket>): FakeHandlers {
  const handlers = new Map<string, Array<(...args: never[]) => void>>();
  const sent: FakeEmitRecord[] = [];
  const track = (event: string, ...args: unknown[]) => sent.push({ event, args });

  const socket = {
    data: {} as Record<string, unknown>,
    id,
    join: async (_room: string) => undefined,
    leave: async (_room: string) => undefined,
    emit: (event: string, payload?: unknown, ack?: (response: unknown) => void) => {
      track(event, payload);
      ack?.({ ok: true });
    },
    to: (_room: string) => ({
      emit: (event: string, payload?: unknown) => track(event, payload),
    }),
    on: (event: string, handler: (...args: never[]) => void) => {
      const list = handlers.get(event) ?? [];
      list.push(handler);
      handlers.set(event, list);
    },
    server: { sockets: { sockets: shared } },
  };

  shared.set(id, socket as import("../src/realtime/socket.js").MeetingSocket);
  return { socket: socket as import("../src/realtime/socket.js").MeetingSocket, handlers, sent, id };
}

function fireSocket(socket: FakeHandlers, event: string, ...args: unknown[]) {
  for (const handler of socket.handlers.get(event) ?? []) {
    try {
      (handler as unknown as (...handlerArgs: unknown[]) => void)(...args);
    } catch (error) {
      throw new Error(`Handler for "${event}" threw: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

function findEvent(socket: FakeHandlers, event: string): FakeEmitRecord | undefined {
  return socket.sent.find((item) => item.event === event);
}

describe("realtime meeting handlers", () => {
  it("joins a meeting and delivers the full caption pipeline", async () => {
    const { bootstrap, shutdown } = await import("../src/bootstrap.js");
    const { registerMeetingHandlers } = await import("../src/realtime/socket.js");
    const { MeetingModel, ParticipantModel, TranscriptSegmentModel } = await import("../src/models/index.js");
    const server = await bootstrap({ port: 0 });
    const app = server.app as Awaited<ReturnType<typeof getTestApp>>;

    const register = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Rt Teacher",
        email: "rt.teacher@nexclass.local",
        password: "Passw0rd!Rt",
        role: "teacher",
        preferredLanguage: "en",
      });
    const token = register.body.token as string;
    const create = await request(app)
      .post("/api/meetings")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Realtime Test", speakerLanguage: "en" });
    const meeting = create.body.meeting as { code: string };

    // The host has not joined yet, so the teacher joins with their user id
    // and the handler creates the participant row.
    const hostParticipant = null;
    void hostParticipant;

    const shared = new Map<string, import("../src/realtime/socket.js").MeetingSocket>();
    const teacher = makeFakeSocket("sock-teacher", shared);
    const student = makeFakeSocket("sock-student", shared);

    const teacherIdentity = {
      userId: "User_rt_teacher_local",
      participantId: null,
      name: "Rt Teacher",
      role: "teacher" as const,
      meetingCode: null,
    };
    const studentIdentity = {
      userId: null,
      participantId: null,
      name: "Student",
      role: "student" as const,
      meetingCode: null,
    };

    registerMeetingHandlers(teacher.socket, teacherIdentity);
    registerMeetingHandlers(student.socket, studentIdentity);

    const joinAcks: Array<{ ok: boolean }> = [];
    for (const [fake, payload] of [
      [teacher, { meetingCode: meeting.code, name: "Rt", language: "en" }],
      [
        student,
        {
          meetingCode: meeting.code,
          name: "Student",
          language: "ta",
          captionLanguage: "ta",
          voiceLanguage: "ta",
        },
      ],
    ] as const) {
      fireSocket(fake, "meeting:join", payload, (response: unknown) => joinAcks.push(response as { ok: boolean }));
    }
    // Both join acks resolved and every socket landed in the shared map.
    await waitFor(() => joinAcks.length >= 2, 5000);
    expect(joinAcks).toHaveLength(2);
    if (!joinAcks.every((ack) => ack.ok)) {
      console.log("DIAG acks", JSON.stringify(joinAcks), JSON.stringify([
        teacher.sent.filter((item) => item.event === "error:message"),
        student.sent.filter((item) => item.event === "error:message"),
      ]));
    }
    expect(joinAcks.every((ack) => ack.ok)).toBe(true);

    const meetingAfterJoin = (await MeetingModel.findOne({ code: meeting.code })) as unknown as {
      status: string;
    };
    expect(meetingAfterJoin?.status).toBe("live");

    // The teacher speaks. Translation with no provider must keep the
    // original English transcript and report the translation as failed -
    // never fabricate a translation.
    await new Promise<void>((resolve) => {
      fireSocket(teacher, "caption:original", {
        text: "The eigenvalue decides the stability of the matrix.",
        language: "en",
      });
      resolve();
    });

    await waitFor(() => student.sent.some((item) => item.event === "caption:segment"), 8000);
    const completed = student.sent
      .filter((item) => item.event === "caption:segment")
      .map((item) => item.args[0] as {
        segment: { status: string; originalText: string; translations: Record<string, { status: string; text: string }> };
      })
      .find((item) => item.segment.status === "complete");
    expect(completed).toBeTruthy();
    // Original text is preserved verbatim.
    expect(completed!.segment.originalText).toBe(
      "The eigenvalue decides the stability of the matrix.",
    );
    // No provider means the Hindi translation is reported as failed - not invented.
    const anyTranslation = Object.values(completed!.segment.translations).find(
      (item) => item.status === "failed",
    );
    expect(anyTranslation).toBeTruthy();
    // English translation of an English segment is the original itself.
    const en = completed!.segment.translations["en"];
    expect(en.status).toBe("complete");
    expect(en?.text).toBe("The eigenvalue decides the stability of the matrix.");
    // The transcript was persisted with the original text.
    const persisted = (await TranscriptSegmentModel.findOne({
      meetingCode: meeting.code,
    })) as unknown as { originalText: string; status: string } | null;
    expect(persisted?.originalText).toBe("The eigenvalue decides the stability of the matrix.");

    // Chat flows to other participants.
    fireSocket(teacher, "chat:send", { message: "Hello class" });
    await waitFor(() => Boolean(findEvent(student, "chat:message")), 4000);
    const chatEnvelope = findEvent(student, "chat:message")!.args[0] as {
      message: { message: string; senderName: string };
    };
    expect(chatEnvelope.message.message).toBe("Hello class");

    // WebRTC signalling relays to the target participant.
    const afterJoin = (await ParticipantModel.find({ meetingCode: meeting.code, leftAt: null }).exec()) as unknown as Array<{
      id?: string;
      displayName: string;
    }>;
    const studentParticipant = afterJoin.find((p) => p.displayName === "Student")!;

    fireSocket(teacher, "webrtc:offer", {
      toId: studentParticipant.id,
      sdp: { type: "offer", sdp: "v=0" },
    });
    await waitFor(() => Boolean(findEvent(student, "webrtc:offer")), 4000);
    const offer = findEvent(student, "webrtc:offer")!.args[0] as { sdp: unknown };
    expect(offer.sdp).toEqual({ type: "offer", sdp: "v=0" });

    await shutdown(server);
  });
});

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

async function listen(httpServer: http.Server): Promise<number> {
  await new Promise<void>((resolve) => httpServer.listen(0, "localhost", resolve));
  const address = httpServer.address();
  if (typeof address === "object" && address) return address.port;
  throw new Error("No ephemeral port.");
}

async function waitFor(predicate: () => boolean, timeoutMs = 5000): Promise<void> {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeoutMs) throw new Error("Timed out waiting for condition.");
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

afterAll(() => {
  void request;
});

