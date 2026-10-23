import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { PassThrough, Readable } from "node:stream";
import request from "supertest";

async function waitFor(predicate: () => boolean, timeoutMs = 5000): Promise<void> {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeoutMs) throw new Error("Timed out waiting for condition.");
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
import { createApp } from "../src/app";
import { MeetingModel, RecordingModel, toRecordingPublic } from "../src/models/index";
import {
  deleteRecording,
  downloadRecording,
  getRecordingsDir,
  saveRecordingStream,
  setRecordingsDir,
  streamRecording,
} from "../src/services/recordings";
import {
  clearParticipantSockets,
  participantSockets,
  registerMeetingHandlers,
  resetRoomRecordingStates,
  type MeetingSocket,
} from "../src/realtime/socket";

const TEST_RECORDINGS_DIR = path.resolve(process.cwd(), "tests/tmp_recordings");

type FakeEmitRecord = { event: string; args: unknown[] };

interface FakeHandlers {
  socket: MeetingSocket;
  handlers: Map<string, Array<(...args: never[]) => void>>;
  sent: FakeEmitRecord[];
  id: string;
}

function makeFakeSocket(id: string, shared: Map<string, MeetingSocket>): FakeHandlers {
  const handlers = new Map<string, Array<(...args: never[]) => void>>();
  const sent: FakeEmitRecord[] = [];
  const track = (event: string, ...args: unknown[]) => sent.push({ event, args });

  const socket: MeetingSocket = {
    data: {} as Record<string, unknown>,
    join: async (_room: string) => undefined,
    leave: async (_room: string) => undefined,
    emit: (event: string, payload?: unknown, ack?: (response: unknown) => void) => {
      track(event, payload);
      ack?.({ ok: true, payload });
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

  shared.set(id, socket);
  return { socket, handlers, sent, id };
}

function fireSocket(socket: FakeHandlers, event: string, ...args: unknown[]) {
  for (const handler of socket.handlers.get(event) ?? []) {
    (handler as unknown as (...handlerArgs: unknown[]) => void)(...args);
  }
}

function findEvents(socket: FakeHandlers, event: string): FakeEmitRecord[] {
  return socket.sent.filter((item) => item.event === event);
}

describe("Meeting Recording & Signaling", () => {
  beforeAll(() => {
    fs.mkdirSync(TEST_RECORDINGS_DIR, { recursive: true });
    setRecordingsDir(TEST_RECORDINGS_DIR);
  });

  afterAll(() => {
    setRecordingsDir(null);
    try {
      if (fs.existsSync(TEST_RECORDINGS_DIR)) {
        fs.rmSync(TEST_RECORDINGS_DIR, { recursive: true, force: true });
      }
    } catch {
      // ignore
    }
  });

  /* ------------------------------------------------------------------ *
   * Unit: Recording Model & In-Memory Store
   * ------------------------------------------------------------------ */
  describe("RecordingModel", () => {
    it("creates and retrieves a recording document with expected fields", async () => {
      const doc = await RecordingModel.create({
        meetingCode: "REC001",
        fileName: "test_rec_001.webm",
        filePath: "/tmp/test_rec_001.webm",
        mimeType: "video/webm",
        sizeBytes: 1048576,
        durationSeconds: 65,
        recordedBy: "part_teacher_1",
        recordedByName: "Prof. Ananya",
      });

      expect(doc.id).toBeDefined();
      expect(doc.meetingCode).toBe("REC001");
      expect(doc.fileName).toBe("test_rec_001.webm");
      expect(doc.sizeBytes).toBe(1048576);
      expect(doc.durationSeconds).toBe(65);

      const found = await RecordingModel.findById(doc.id!);
      expect(found).not.toBeNull();
      expect(found?.meetingCode).toBe("REC001");

      const publicSummary = toRecordingPublic(doc);
      expect(publicSummary.id).toBe(doc.id);
      expect(publicSummary.meetingCode).toBe("REC001");
      expect(publicSummary.downloadUrl).toBe(`/api/meetings/REC001/recordings/${doc.id}/download`);
      expect(publicSummary.streamUrl).toBe(`/api/meetings/REC001/recordings/${doc.id}/stream`);
    });
  });

  /* ------------------------------------------------------------------ *
   * Unit: Disk Storage & Range Streaming Service
   * ------------------------------------------------------------------ */
  describe("Recordings Storage & Stream Service", () => {
    it("pipes binary stream to disk and persists recording metadata", async () => {
      const sampleData = Buffer.from("RIFF" + "x".repeat(2044)); // 2048 bytes sample
      const inputStream = Readable.from(sampleData);

      const saved = await saveRecordingStream({
        meetingCode: "DISK01",
        stream: inputStream,
        mimeType: "video/webm",
        durationSeconds: 15,
        recordedBy: "user_test",
        recordedByName: "Tester",
      });

      expect(saved.id).toBeDefined();
      expect(saved.sizeBytes).toBe(2048);
      expect(fs.existsSync(saved.filePath)).toBe(true);
      expect(fs.statSync(saved.filePath).size).toBe(2048);

      // Clean up using deleteRecording
      const deleted = await deleteRecording(saved.id!);
      expect(deleted).toBe(true);
      expect(fs.existsSync(saved.filePath)).toBe(false);
      const afterDelete = await RecordingModel.findById(saved.id!);
      expect(afterDelete).toBeNull();
    });

    it("handles HTTP 206 Partial Content Range streaming with Content-Range", async () => {
      const sampleData = Buffer.from("A".repeat(1000));
      const saved = await saveRecordingStream({
        meetingCode: "RANGE1",
        stream: Readable.from(sampleData),
        mimeType: "video/webm",
      });

      // Mock Express Response for Range testing
      let statusCode = 200;
      const headers: Record<string, unknown> = {};

      const mockRes = new PassThrough() as unknown as import("express").Response;
      (mockRes as unknown as Record<string, unknown>).writeHead = (status: number, h: Record<string, unknown>) => {
        statusCode = status;
        Object.assign(headers, h);
        return mockRes;
      };

      // 1. Partial Range: bytes=0-199
      streamRecording(saved, {
        rangeHeader: "bytes=0-199",
        res: mockRes,
      });

      expect(statusCode).toBe(206);
      expect(headers["Content-Range"]).toBe("bytes 0-199/1000");
      expect(headers["Content-Length"]).toBe(200);
      expect(headers["Accept-Ranges"]).toBe("bytes");
      expect(headers["Content-Type"]).toBe("video/webm");

      await new Promise<void>((resolve) => {
        mockRes.on("finish", () => resolve());
        setTimeout(resolve, 50);
      });

      await deleteRecording(saved.id!);
    });

    it("returns HTTP 416 for invalid out-of-bounds range request", async () => {
      const sampleData = Buffer.from("B".repeat(500));
      const saved = await saveRecordingStream({
        meetingCode: "RANGE2",
        stream: Readable.from(sampleData),
        mimeType: "video/webm",
      });

      let sentStatus = 0;
      const headers: Record<string, unknown> = {};
      const mockRes = {
        setHeader(name: string, value: unknown) {
          headers[name] = value;
          return this;
        },
        sendStatus(code: number) {
          sentStatus = code;
          return this;
        },
      } as unknown as import("express").Response;

      streamRecording(saved, {
        rangeHeader: "bytes=5000-6000",
        res: mockRes,
      });

      expect(sentStatus).toBe(416);
      expect(headers["Content-Range"]).toBe("bytes */500");

      await deleteRecording(saved.id!);
    });
  });

  /* ------------------------------------------------------------------ *
   * Integration: REST API Routes (/api/meetings/:code/recordings)
   * ------------------------------------------------------------------ */
  describe("Recording REST API", () => {
    const app = createApp();
    let meetingCode: string;

    beforeAll(async () => {
      meetingCode = "REC101";
      await MeetingModel.create({
        code: meetingCode,
        title: "Recording Test Meeting",
        hostId: "teacher_rec_host",
        hostName: "Dr. Bose",
        status: "live",
      });
    });

    it("POST /api/meetings/:code/recordings uploads binary stream directly to disk", async () => {
      const fakeVideoPayload = Buffer.from("NEXCLASS_WEBM_BINARY_PAYLOAD_".repeat(32)); // ~960 bytes

      const res = await request(app)
        .post(`/api/meetings/${meetingCode}/recordings`)
        .set("Content-Type", "video/webm")
        .set("x-recording-duration", "42.5")
        .set("x-recorded-by", "part_101")
        .send(fakeVideoPayload);

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.recording).toBeDefined();
      expect(res.body.recording.meetingCode).toBe(meetingCode);
      expect(res.body.recording.sizeBytes).toBe(fakeVideoPayload.length);
      expect(res.body.recording.durationSeconds).toBe(42.5);
      expect(res.body.recording.downloadUrl).toContain(`/api/meetings/${meetingCode}/recordings/`);
      expect(res.body.recording.streamUrl).toContain(`/api/meetings/${meetingCode}/recordings/`);

      const recordingId = res.body.recording.id as string;

      // GET /api/meetings/:code/recordings
      const listRes = await request(app).get(`/api/meetings/${meetingCode}/recordings`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.ok).toBe(true);
      expect(Array.isArray(listRes.body.recordings)).toBe(true);
      const found = listRes.body.recordings.find((r: { id: string }) => r.id === recordingId);
      expect(found).toBeDefined();
      expect(found.durationSeconds).toBe(42.5);

      // GET /api/meetings/:code/recordings/:id/stream (full stream)
      const streamRes = await request(app).get(
        `/api/meetings/${meetingCode}/recordings/${recordingId}/stream`,
      );
      expect(streamRes.status).toBe(200);
      expect(streamRes.headers["accept-ranges"]).toBe("bytes");
      expect(streamRes.headers["content-type"]).toContain("video/webm");
      expect(streamRes.body.length).toBe(fakeVideoPayload.length);

      // GET /api/meetings/:code/recordings/:id/stream (range stream HTTP 206)
      const rangeRes = await request(app)
        .get(`/api/meetings/${meetingCode}/recordings/${recordingId}/stream`)
        .set("Range", "bytes=0-99");
      expect(rangeRes.status).toBe(206);
      expect(rangeRes.headers["content-range"]).toBe(`bytes 0-99/${fakeVideoPayload.length}`);
      expect(rangeRes.headers["content-length"]).toBe("100");

      // GET /api/meetings/:code/recordings/:id/download
      const downloadRes = await request(app).get(
        `/api/meetings/${meetingCode}/recordings/${recordingId}/download`,
      );
      expect(downloadRes.status).toBe(200);
      expect(downloadRes.headers["content-disposition"]).toContain("attachment");
      expect(downloadRes.body.length).toBe(fakeVideoPayload.length);

      // Clean up
      await deleteRecording(recordingId);
    });

    it("returns 404 for non-existent meeting code", async () => {
      const res = await request(app)
        .get("/api/meetings/UNKNOWN999/recordings");
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("meeting_not_found");
    });

    it("returns 404 for non-existent recording ID", async () => {
      const res = await request(app)
        .get(`/api/meetings/${meetingCode}/recordings/non_existent_rec_id/stream`);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("recording_not_found");
    });
  });

  /* ------------------------------------------------------------------ *
   * Realtime: Recording Signaling & O(1) WebRTC Peer Map
   * ------------------------------------------------------------------ */
  describe("Realtime Recording Signaling & WebRTC Map", () => {
    let meetingCode: string;

    beforeAll(async () => {
      meetingCode = "RTREC1";
      await MeetingModel.create({
        code: meetingCode,
        title: "Realtime Recording Classroom",
        hostId: "teacher_rt_id",
        hostName: "Prof. Raman",
        status: "live",
      });
    });

    afterAll(() => {
      clearParticipantSockets();
      resetRoomRecordingStates();
    });

    it("handles recording:start, recording:pause, recording:resume, recording:stop with O(1) state broadcast", async () => {
      const shared = new Map<string, MeetingSocket>();
      clearParticipantSockets();
      resetRoomRecordingStates();

      const teacher = makeFakeSocket("teacher-sock", shared);
      const student = makeFakeSocket("student-sock", shared);

      const teacherIdentity = {
        userId: "user_teacher_rt",
        participantId: "part_teacher_rt",
        name: "Prof. Raman",
        role: "teacher" as const,
        meetingCode: null,
      };

      const studentIdentity = {
        userId: "user_student_rt",
        participantId: "part_student_rt",
        name: "Aakash",
        role: "student" as const,
        meetingCode: null,
      };

      registerMeetingHandlers(teacher.socket, teacherIdentity);
      registerMeetingHandlers(student.socket, studentIdentity);

      // Join teacher and student with ack callback
      const joinAcks: Array<{ ok: boolean; participantId?: string }> = [];
      fireSocket(teacher, "meeting:join", { meetingCode, name: "Prof. Raman", language: "en" }, (ack: unknown) => {
        joinAcks.push(ack as { ok: boolean; participantId?: string });
      });
      fireSocket(student, "meeting:join", { meetingCode, name: "Aakash", language: "ta" }, (ack: unknown) => {
        joinAcks.push(ack as { ok: boolean; participantId?: string });
      });

      await waitFor(() => joinAcks.length >= 2, 5000);
      expect(joinAcks.every((a) => a.ok)).toBe(true);

      // Verify participantSockets map is populated with O(1) entries
      const teacherPartId = teacherIdentity.participantId!;
      const studentPartId = studentIdentity.participantId!;
      expect(participantSockets.has(teacherPartId)).toBe(true);
      expect(participantSockets.has(studentPartId)).toBe(true);

      // 1. Start Recording
      let startAck: { ok: boolean; state?: unknown } | null = null;
      fireSocket(teacher, "recording:start", { meetingCode }, (res: unknown) => {
        startAck = res as { ok: boolean; state?: unknown };
      });

      expect(startAck).not.toBeNull();
      expect(startAck!.ok).toBe(true);

      // Check student received recording:state broadcast
      const studentStateEvents = findEvents(student, "recording:state");
      expect(studentStateEvents.length).toBeGreaterThanOrEqual(1);
      const latestState = studentStateEvents[studentStateEvents.length - 1].args[0] as {
        isRecording: boolean;
        isPaused: boolean;
        startedAt: number | null;
      };
      expect(latestState.isRecording).toBe(true);
      expect(latestState.isPaused).toBe(false);
      expect(latestState.startedAt).toBeTypeOf("number");

      // 2. Pause Recording
      let pauseAck: Record<string, unknown> | null = null;
      fireSocket(teacher, "recording:pause", { meetingCode }, (res: unknown) => {
        pauseAck = res as Record<string, unknown>;
      });
      expect(pauseAck).not.toBeNull();
      expect(pauseAck!["ok"]).toBe(true);

      const pausedStateEvents = findEvents(student, "recording:state");
      const pausedState = pausedStateEvents[pausedStateEvents.length - 1].args[0] as {
        isRecording: boolean;
        isPaused: boolean;
      };
      expect(pausedState.isRecording).toBe(true);
      expect(pausedState.isPaused).toBe(true);

      // 3. Resume Recording
      let resumeAck: Record<string, unknown> | null = null;
      fireSocket(teacher, "recording:resume", { meetingCode }, (res: unknown) => {
        resumeAck = res as Record<string, unknown>;
      });
      expect(resumeAck).not.toBeNull();
      expect(resumeAck!["ok"]).toBe(true);

      const resumedStateEvents = findEvents(student, "recording:state");
      const resumedState = resumedStateEvents[resumedStateEvents.length - 1].args[0] as {
        isRecording: boolean;
        isPaused: boolean;
      };
      expect(resumedState.isRecording).toBe(true);
      expect(resumedState.isPaused).toBe(false);

      // 4. Stop Recording
      let stopAck: Record<string, unknown> | null = null;
      fireSocket(teacher, "recording:stop", { meetingCode }, (res: unknown) => {
        stopAck = res as Record<string, unknown>;
      });
      expect(stopAck).not.toBeNull();
      expect(stopAck!["ok"]).toBe(true);

      const stoppedStateEvents = findEvents(student, "recording:state");
      const stoppedState = stoppedStateEvents[stoppedStateEvents.length - 1].args[0] as {
        isRecording: boolean;
        isPaused: boolean;
        startedAt: null;
      };
      expect(stoppedState.isRecording).toBe(false);
      expect(stoppedState.isPaused).toBe(false);
      expect(stoppedState.startedAt).toBeNull();

      // 5. O(1) WebRTC signaling routing to student
      fireSocket(teacher, "webrtc:offer", {
        toId: studentPartId,
        sdp: { type: "offer", sdp: "v=0\r\no=- 12345 2 IN IP4 127.0.0.1" },
      });

      const offerEvents = findEvents(student, "webrtc:offer");
      expect(offerEvents.length).toBeGreaterThan(0);
      const offer = offerEvents[0].args[0] as { fromId: string; sdp: { type: string } };
      expect(offer.fromId).toBe(teacherPartId);
      expect(offer.sdp.type).toBe("offer");

      // Disconnect student and verify cleanup from participantSockets
      fireSocket(student, "disconnect");
      expect(participantSockets.has(studentPartId)).toBe(false);
    });
  });
});
