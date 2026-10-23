import { afterAll, beforeAll, describe, expect, it } from "vitest";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PassThrough, Readable } from "node:stream";
import request from "supertest";
import { createApp } from "../src/app";
import { MeetingModel, RecordingModel } from "../src/models/index";
import {
  deleteRecording,
  setRecordingsDir,
  saveRecordingStream,
  streamRecording,
  findRecordingsByMeeting,
  findRecordingById,
} from "../src/services/recordings";
import {
  clearParticipantSockets,
  participantSockets,
  registerMeetingHandlers,
  resetRoomRecordingStates,
  type MeetingSocket,
} from "../src/realtime/socket";

const TEST_RECORDINGS_DIR = path.resolve(process.cwd(), "tests/tmp_adversarial_recordings");

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

function sha256(data: Buffer | string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function waitFor(predicate: () => boolean, timeoutMs = 5000): Promise<void> {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeoutMs) throw new Error("Timed out waiting for condition.");
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

describe("Adversarial Empirical Challenge: Recording & Signaling", () => {
  const app = createApp();

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

  /* =========================================================================
   * Challenge 1: Binary Stream Uploads & Bit-for-Bit Byte Integrity
   * ========================================================================= */
  describe("1. Binary Stream Uploads & Byte Integrity", () => {
    const meetingCode = "ADVREC01";

    beforeAll(async () => {
      await MeetingModel.create({
        code: meetingCode,
        title: "Adversarial Recording Test Meeting",
        hostId: "host_adv_1",
        hostName: "Adversarial Host",
        status: "live",
      });
    });

    it("verifies small binary payload (512B) bit-for-bit against disk and download", async () => {
      // High-entropy random binary data including null bytes (0x00) and 0xFF
      const originalBytes = crypto.randomBytes(512);
      const originalHash = sha256(originalBytes);

      const res = await request(app)
        .post(`/api/meetings/${meetingCode}/recordings`)
        .set("Content-Type", "video/webm")
        .set("x-recording-duration", "10")
        .set("x-recorded-by", "adv_tester")
        .send(originalBytes);

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      const rec = res.body.recording;
      expect(rec.sizeBytes).toBe(512);

      // Verify file on disk bit-for-bit
      const recDoc = await findRecordingById(rec.id);
      expect(recDoc).not.toBeNull();
      const diskBytes = fs.readFileSync(recDoc!.filePath);
      expect(diskBytes.length).toBe(512);
      expect(sha256(diskBytes)).toBe(originalHash);

      // Verify download endpoint delivers identical bytes bit-for-bit
      const downloadRes = await request(app)
        .get(`/api/meetings/${meetingCode}/recordings/${rec.id}/download`)
        .responseType("blob");
      expect(downloadRes.status).toBe(200);
      const downloadedBytes = Buffer.from(downloadRes.body);
      expect(downloadedBytes.length).toBe(512);
      expect(sha256(downloadedBytes)).toBe(originalHash);

      // Verify full stream endpoint delivers identical bytes bit-for-bit
      const streamRes = await request(app)
        .get(`/api/meetings/${meetingCode}/recordings/${rec.id}/stream`)
        .responseType("blob");
      expect(streamRes.status).toBe(200);
      const streamedBytes = Buffer.from(streamRes.body);
      expect(streamedBytes.length).toBe(512);
      expect(sha256(streamedBytes)).toBe(originalHash);

      await deleteRecording(rec.id);
    });

    it("verifies medium binary payload (256KB) with size header mismatch handling", async () => {
      const originalBytes = crypto.randomBytes(256 * 1024);
      const originalHash = sha256(originalBytes);

      // Deliberately send mismatched x-recording-size (e.g. 999999) to verify server uses actual bytes
      const res = await request(app)
        .post(`/api/meetings/${meetingCode}/recordings`)
        .set("Content-Type", "video/webm")
        .set("x-recording-size", "999999") // Intentional mismatch
        .set("x-recording-duration", "35.2")
        .send(originalBytes);

      expect(res.status).toBe(201);
      const rec = res.body.recording;
      expect(rec.sizeBytes).toBe(256 * 1024); // Must reflect real disk size, not header

      const recDoc = await findRecordingById(rec.id);
      const diskBytes = fs.readFileSync(recDoc!.filePath);
      expect(sha256(diskBytes)).toBe(originalHash);

      await deleteRecording(rec.id);
    });

    it("verifies chunked streaming upload (1MB across 16KB chunks) via saveRecordingStream", async () => {
      const originalBytes = crypto.randomBytes(1024 * 1024); // 1 MB
      const originalHash = sha256(originalBytes);

      // Create a chunked stream simulating browser MediaRecorder chunks
      const chunkSize = 16 * 1024;
      const chunks: Buffer[] = [];
      for (let i = 0; i < originalBytes.length; i += chunkSize) {
        chunks.push(originalBytes.subarray(i, i + chunkSize));
      }

      const inputStream = new PassThrough();
      const savePromise = saveRecordingStream({
        meetingCode,
        stream: inputStream,
        mimeType: "video/webm",
        durationSeconds: 60,
      });

      for (const chunk of chunks) {
        inputStream.write(chunk);
      }
      inputStream.end();

      const saved = await savePromise;
      expect(saved.sizeBytes).toBe(1024 * 1024);
      const diskBytes = fs.readFileSync(saved.filePath);
      expect(sha256(diskBytes)).toBe(originalHash);

      await deleteRecording(saved.id!);
    });

    it("cleans up partial files on disk if upload stream emits an error mid-flight", async () => {
      const faultyStream = new PassThrough();
      const savePromise = saveRecordingStream({
        meetingCode,
        stream: faultyStream,
        fileName: "faulty_stream_test.webm",
      });

      // Write some initial bytes then abort with error
      faultyStream.write(Buffer.from("PARTIAL_DATA_HEADER"));
      faultyStream.emit("error", new Error("Simulated network drop"));

      await expect(savePromise).rejects.toThrow("Simulated network drop");

      // Verify the partial file was unlinked from disk
      const filePath = path.join(TEST_RECORDINGS_DIR, "faulty_stream_test.webm");
      expect(fs.existsSync(filePath)).toBe(false);
    });

    it("handles 0-byte empty recording upload gracefully", async () => {
      const emptyBuffer = Buffer.alloc(0);
      const res = await request(app)
        .post(`/api/meetings/${meetingCode}/recordings`)
        .set("Content-Type", "video/webm")
        .set("x-recording-duration", "0")
        .send(emptyBuffer);

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      const rec = res.body.recording;
      expect(rec.sizeBytes).toBe(0);

      const diskBytes = fs.readFileSync((await findRecordingById(rec.id))!.filePath);
      expect(diskBytes.length).toBe(0);

      // Verify download of 0-byte file succeeds with Content-Length 0
      const downloadRes = await request(app).get(`/api/meetings/${meetingCode}/recordings/${rec.id}/download`);
      expect(downloadRes.status).toBe(200);
      expect(downloadRes.headers["content-length"]).toBe("0");

      await deleteRecording(rec.id);
    });

    it("rejects or safely handles unexpected Content-Type without hanging request", async () => {
      // If a client sends application/json, express.json consumes req body
      const res = await request(app)
        .post(`/api/meetings/${meetingCode}/recordings`)
        .set("Content-Type", "application/json")
        .send({ dummy: "not_a_video" });

      // Must complete without hanging (either 201 with empty/serialized content or 400 Bad Request)
      expect([201, 400, 415]).toContain(res.status);
      if (res.body?.recording?.id) {
        await deleteRecording(res.body.recording.id);
      }
    });
  });

  /* =========================================================================
   * Challenge 2: HTTP 206 Range Requests & Slices
   * ========================================================================= */
  describe("2. HTTP 206 Range Requests & Slice Reassembly", () => {
    const meetingCode = "ADVREC02";
    let recordingId: string;
    let originalData: Buffer;
    const TOTAL_BYTES = 64 * 1024; // 64 KB

    beforeAll(async () => {
      await MeetingModel.create({
        code: meetingCode,
        title: "Range Stress Meeting",
        hostId: "host_range",
        hostName: "Range Host",
        status: "live",
      });

      originalData = crypto.randomBytes(TOTAL_BYTES);
      const res = await request(app)
        .post(`/api/meetings/${meetingCode}/recordings`)
        .set("Content-Type", "video/webm")
        .send(originalData);
      recordingId = res.body.recording.id;
    });

    afterAll(async () => {
      if (recordingId) {
        await deleteRecording(recordingId);
      }
    });

    it("verifies single-byte range request at start: bytes=0-0", async () => {
      const res = await request(app)
        .get(`/api/meetings/${meetingCode}/recordings/${recordingId}/stream`)
        .set("Range", "bytes=0-0")
        .responseType("blob");

      expect(res.status).toBe(206);
      expect(res.headers["content-range"]).toBe(`bytes 0-0/${TOTAL_BYTES}`);
      expect(res.headers["content-length"]).toBe("1");
      const body = Buffer.from(res.body);
      expect(body.length).toBe(1);
      expect(body[0]).toBe(originalData[0]);
    });

    it("verifies single-byte range request at end: bytes={N-1}-{N-1}", async () => {
      const lastByteIndex = TOTAL_BYTES - 1;
      const res = await request(app)
        .get(`/api/meetings/${meetingCode}/recordings/${recordingId}/stream`)
        .set("Range", `bytes=${lastByteIndex}-${lastByteIndex}`)
        .responseType("blob");

      expect(res.status).toBe(206);
      expect(res.headers["content-range"]).toBe(`bytes ${lastByteIndex}-${lastByteIndex}/${TOTAL_BYTES}`);
      expect(res.headers["content-length"]).toBe("1");
      const body = Buffer.from(res.body);
      expect(body.length).toBe(1);
      expect(body[0]).toBe(originalData[lastByteIndex]);
    });

    it("verifies arbitrary middle slice: bytes=1024-4095", async () => {
      const start = 1024;
      const end = 4095;
      const expectedLength = end - start + 1; // 3072 bytes
      const expectedSlice = originalData.subarray(start, end + 1);

      const res = await request(app)
        .get(`/api/meetings/${meetingCode}/recordings/${recordingId}/stream`)
        .set("Range", `bytes=${start}-${end}`)
        .responseType("blob");

      expect(res.status).toBe(206);
      expect(res.headers["content-range"]).toBe(`bytes ${start}-${end}/${TOTAL_BYTES}`);
      expect(res.headers["content-length"]).toBe(String(expectedLength));
      const body = Buffer.from(res.body);
      expect(body.length).toBe(expectedLength);
      expect(sha256(body)).toBe(sha256(expectedSlice));
    });

    it("verifies suffix range request: bytes=-256 (last 256 bytes)", async () => {
      const suffix = 256;
      const expectedStart = TOTAL_BYTES - suffix;
      const expectedEnd = TOTAL_BYTES - 1;
      const expectedSlice = originalData.subarray(expectedStart);

      const res = await request(app)
        .get(`/api/meetings/${meetingCode}/recordings/${recordingId}/stream`)
        .set("Range", `bytes=-${suffix}`)
        .responseType("blob");

      expect(res.status).toBe(206);
      expect(res.headers["content-range"]).toBe(`bytes ${expectedStart}-${expectedEnd}/${TOTAL_BYTES}`);
      expect(res.headers["content-length"]).toBe(String(suffix));
      const body = Buffer.from(res.body);
      expect(sha256(body)).toBe(sha256(expectedSlice));
    });

    it("verifies open-ended range request: bytes=32768- (from middle to end)", async () => {
      const start = 32768;
      const expectedEnd = TOTAL_BYTES - 1;
      const expectedLength = expectedEnd - start + 1;
      const expectedSlice = originalData.subarray(start);

      const res = await request(app)
        .get(`/api/meetings/${meetingCode}/recordings/${recordingId}/stream`)
        .set("Range", `bytes=${start}-`)
        .responseType("blob");

      expect(res.status).toBe(206);
      expect(res.headers["content-range"]).toBe(`bytes ${start}-${expectedEnd}/${TOTAL_BYTES}`);
      expect(res.headers["content-length"]).toBe(String(expectedLength));
      const body = Buffer.from(res.body);
      expect(sha256(body)).toBe(sha256(expectedSlice));
    });

    it("verifies complete file reassembly by sequential 4KB slices", async () => {
      const sliceSize = 4 * 1024; // 4KB slices = 16 slices for 64KB
      const downloadedChunks: Buffer[] = [];

      for (let offset = 0; offset < TOTAL_BYTES; offset += sliceSize) {
        const sliceEnd = Math.min(offset + sliceSize - 1, TOTAL_BYTES - 1);
        const res = await request(app)
          .get(`/api/meetings/${meetingCode}/recordings/${recordingId}/stream`)
          .set("Range", `bytes=${offset}-${sliceEnd}`)
          .responseType("blob");

        expect(res.status).toBe(206);
        downloadedChunks.push(Buffer.from(res.body));
      }

      const reassembled = Buffer.concat(downloadedChunks);
      expect(reassembled.length).toBe(TOTAL_BYTES);
      expect(sha256(reassembled)).toBe(sha256(originalData));
    });

    it("returns HTTP 416 for out-of-bounds start range (start >= fileSize)", async () => {
      const res = await request(app)
        .get(`/api/meetings/${meetingCode}/recordings/${recordingId}/stream`)
        .set("Range", `bytes=${TOTAL_BYTES}-${TOTAL_BYTES + 100}`);

      expect(res.status).toBe(416);
      expect(res.headers["content-range"]).toBe(`bytes */${TOTAL_BYTES}`);
    });

    it("returns HTTP 416 for inverted range (start > end)", async () => {
      const res = await request(app)
        .get(`/api/meetings/${meetingCode}/recordings/${recordingId}/stream`)
        .set("Range", "bytes=500-200");

      expect(res.status).toBe(416);
      expect(res.headers["content-range"]).toBe(`bytes */${TOTAL_BYTES}`);
    });

    it("returns HTTP 416 for malformed Range header format", async () => {
      const res = await request(app)
        .get(`/api/meetings/${meetingCode}/recordings/${recordingId}/stream`)
        .set("Range", "invalid-syntax");

      expect(res.status).toBe(416);
      expect(res.headers["content-range"]).toBe(`bytes */${TOTAL_BYTES}`);
    });

    it("tests Range header with end >= fileSize (RFC 9110 §14.1.2 requires clamping end = fileSize - 1)", async () => {
      // Browsers often request large chunks exceeding total file size (e.g. 1MB chunk on 64KB file).
      // Under RFC 9110 §14.1.2: if end >= length, server should clamp end = length - 1 and return 206.
      const res = await request(app)
        .get(`/api/meetings/${meetingCode}/recordings/${recordingId}/stream`)
        .set("Range", `bytes=0-${TOTAL_BYTES * 2}`);

      // Check if server returns 206 Partial Content with clamped range
      expect(res.status).toBe(206);
      expect(res.headers["content-range"]).toBe(`bytes 0-${TOTAL_BYTES - 1}/${TOTAL_BYTES}`);
      expect(res.headers["content-length"]).toBe(String(TOTAL_BYTES));
      const body = Buffer.from(res.body);
      expect(body.length).toBe(TOTAL_BYTES);
      expect(sha256(body)).toBe(sha256(originalData));
    });
  });

  /* =========================================================================
   * Challenge 3: Concurrent Stream Uploads & Multi-Meeting Isolation
   * ========================================================================= */
  describe("3. Concurrent Uploads & Meeting Isolation", () => {
    const meetingA = "CONCUR_A";
    const meetingB = "CONCUR_B";

    beforeAll(async () => {
      await MeetingModel.create({
        code: meetingA,
        title: "Room A",
        hostId: "host_a",
        status: "live",
      });
      await MeetingModel.create({
        code: meetingB,
        title: "Room B",
        hostId: "host_b",
        status: "live",
      });
    });

    it("handles simultaneous concurrent uploads to the same and different meetings without cross-talk", async () => {
      const payloadA1 = crypto.randomBytes(32 * 1024);
      const payloadA2 = crypto.randomBytes(48 * 1024);
      const payloadB1 = crypto.randomBytes(64 * 1024);

      const hashA1 = sha256(payloadA1);
      const hashA2 = sha256(payloadA2);
      const hashB1 = sha256(payloadB1);

      // Launch all 3 uploads concurrently
      const [resA1, resA2, resB1] = await Promise.all([
        request(app).post(`/api/meetings/${meetingA}/recordings`).set("Content-Type", "video/webm").send(payloadA1),
        request(app).post(`/api/meetings/${meetingA}/recordings`).set("Content-Type", "video/webm").send(payloadA2),
        request(app).post(`/api/meetings/${meetingB}/recordings`).set("Content-Type", "video/mp4").send(payloadB1),
      ]);

      expect(resA1.status).toBe(201);
      expect(resA2.status).toBe(201);
      expect(resB1.status).toBe(201);

      const idA1 = resA1.body.recording.id;
      const idA2 = resA2.body.recording.id;
      const idB1 = resB1.body.recording.id;

      // Unique IDs and filenames
      expect(idA1).not.toBe(idA2);
      expect(resA1.body.recording.fileName).not.toBe(resA2.body.recording.fileName);

      // Verify disk byte integrity for all 3
      const docA1 = await findRecordingById(idA1);
      const docA2 = await findRecordingById(idA2);
      const docB1 = await findRecordingById(idB1);

      expect(sha256(fs.readFileSync(docA1!.filePath))).toBe(hashA1);
      expect(sha256(fs.readFileSync(docA2!.filePath))).toBe(hashA2);
      expect(sha256(fs.readFileSync(docB1!.filePath))).toBe(hashB1);

      // Isolation: Meeting A list must contain idA1 and idA2, but NOT idB1
      const listA = await findRecordingsByMeeting(meetingA);
      const listB = await findRecordingsByMeeting(meetingB);

      const idsInA = listA.map((r) => r.id);
      const idsInB = listB.map((r) => r.id);

      expect(idsInA).toContain(idA1);
      expect(idsInA).toContain(idA2);
      expect(idsInA).not.toContain(idB1);

      expect(idsInB).toContain(idB1);
      expect(idsInB).not.toContain(idA1);
      expect(idsInB).not.toContain(idA2);

      // Clean up
      await deleteRecording(idA1);
      await deleteRecording(idA2);
      await deleteRecording(idB1);
    });
  });

  /* =========================================================================
   * Challenge 4: Realtime Recording Socket State Machine & Late Joiners
   * ========================================================================= */
  describe("4. Realtime Recording Socket State Machine", () => {
    const meetingCode = "SOCTEST1";
    const sharedSockets = new Map<string, MeetingSocket>();

    beforeAll(async () => {
      await MeetingModel.create({
        code: meetingCode,
        title: "Socket State Machine Meeting",
        hostId: "teacher_host",
        hostName: "Prof. Vikram",
        status: "live",
      });
    });

    afterAll(() => {
      clearParticipantSockets();
      resetRoomRecordingStates();
    });

    it("strictly verifies event sequence: start -> pause -> resume -> stop with broadcast payloads", async () => {
      clearParticipantSockets();
      resetRoomRecordingStates();

      const host = makeFakeSocket("host-socket", sharedSockets);
      const peer = makeFakeSocket("peer-socket", sharedSockets);

      const hostIdentity = {
        userId: "user_host",
        participantId: "part_host",
        name: "Prof. Vikram",
        role: "teacher" as const,
        meetingCode: null,
      };
      const peerIdentity = {
        userId: "user_peer",
        participantId: "part_peer",
        name: "Student Priya",
        role: "student" as const,
        meetingCode: null,
      };

      registerMeetingHandlers(host.socket, hostIdentity);
      registerMeetingHandlers(peer.socket, peerIdentity);

      const joinAcks: Array<{ ok: boolean; participantId?: string }> = [];
      fireSocket(host, "meeting:join", { meetingCode, name: "Prof. Vikram" }, (ack: unknown) => {
        joinAcks.push(ack as { ok: boolean; participantId?: string });
      });
      fireSocket(peer, "meeting:join", { meetingCode, name: "Student Priya" }, (ack: unknown) => {
        joinAcks.push(ack as { ok: boolean; participantId?: string });
      });

      await waitFor(() => joinAcks.length >= 2, 5000);

      // 1. START RECORDING
      let startAck: { ok: boolean; state?: unknown } | null = null;
      fireSocket(host, "recording:start", { meetingCode, participantId: hostIdentity.participantId }, (ack: unknown) => {
        startAck = ack as { ok: boolean; state?: unknown };
      });
      expect(startAck!.ok).toBe(true);

      // Peer must receive both recording:started and recording:state
      const peerStateEvents = findEvents(peer, "recording:state");
      expect(peerStateEvents.length).toBeGreaterThanOrEqual(1);
      const startPayload = peerStateEvents[peerStateEvents.length - 1].args[0] as {
        isRecording: boolean;
        isPaused: boolean;
        startedAt: number | null;
        elapsedSeconds: number;
        recordedBy: string | null;
      };
      expect(startPayload.isRecording).toBe(true);
      expect(startPayload.isPaused).toBe(false);
      expect(startPayload.startedAt).toBeTypeOf("number");
      expect(startPayload.elapsedSeconds).toBe(0);
      expect(startPayload.recordedBy).toBe(hostIdentity.participantId);

      // 2. PAUSE RECORDING
      let pauseAck: { ok: boolean; state?: unknown } | null = null;
      fireSocket(host, "recording:pause", { meetingCode }, (ack: unknown) => {
        pauseAck = ack as { ok: boolean; state?: unknown };
      });
      expect(pauseAck!.ok).toBe(true);

      const peerPauseEvents = findEvents(peer, "recording:state");
      const pausePayload = peerPauseEvents[peerPauseEvents.length - 1].args[0] as {
        isRecording: boolean;
        isPaused: boolean;
      };
      expect(pausePayload.isRecording).toBe(true);
      expect(pausePayload.isPaused).toBe(true);

      // 3. RESUME RECORDING
      let resumeAck: { ok: boolean; state?: unknown } | null = null;
      fireSocket(host, "recording:resume", { meetingCode }, (ack: unknown) => {
        resumeAck = ack as { ok: boolean; state?: unknown };
      });
      expect(resumeAck!.ok).toBe(true);

      const peerResumeEvents = findEvents(peer, "recording:state");
      const resumePayload = peerResumeEvents[peerResumeEvents.length - 1].args[0] as {
        isRecording: boolean;
        isPaused: boolean;
      };
      expect(resumePayload.isRecording).toBe(true);
      expect(resumePayload.isPaused).toBe(false);

      // 4. STOP RECORDING
      let stopAck: { ok: boolean; state?: unknown } | null = null;
      fireSocket(host, "recording:stop", { meetingCode }, (ack: unknown) => {
        stopAck = ack as { ok: boolean; state?: unknown };
      });
      expect(stopAck!.ok).toBe(true);

      const peerStopEvents = findEvents(peer, "recording:state");
      const stopPayload = peerStopEvents[peerStopEvents.length - 1].args[0] as {
        isRecording: boolean;
        isPaused: boolean;
        startedAt: null;
        recordedBy: null;
      };
      expect(stopPayload.isRecording).toBe(false);
      expect(stopPayload.isPaused).toBe(false);
      expect(stopPayload.startedAt).toBeNull();
      expect(stopPayload.recordedBy).toBeNull();
    });

    it("synchronizes recording state to late joiners who join while recording is active", async () => {
      clearParticipantSockets();
      resetRoomRecordingStates();

      const host = makeFakeSocket("host-late-sock", sharedSockets);
      const hostIdentity = {
        userId: "user_host_late",
        participantId: "part_host_late",
        name: "Teacher",
        role: "teacher" as const,
        meetingCode: null,
      };
      registerMeetingHandlers(host.socket, hostIdentity);

      let joined = false;
      fireSocket(host, "meeting:join", { meetingCode, name: "Teacher" }, () => {
        joined = true;
      });
      await waitFor(() => joined, 5000);

      // Start recording
      fireSocket(host, "recording:start", { meetingCode });

      // Now Late Joiner enters
      const lateJoiner = makeFakeSocket("late-joiner-sock", sharedSockets);
      const lateIdentity = {
        userId: "user_late",
        participantId: "part_late",
        name: "Late Student",
        role: "student" as const,
        meetingCode: null,
      };
      registerMeetingHandlers(lateJoiner.socket, lateIdentity);

      let lateJoined = false;
      fireSocket(lateJoiner, "meeting:join", { meetingCode, name: "Late Student" }, () => {
        lateJoined = true;
      });
      await waitFor(() => lateJoined, 5000);

      // Verify late joiner received meeting:joined containing active recordingState
      const meetingJoinedEvents = findEvents(lateJoiner, "meeting:joined");
      expect(meetingJoinedEvents.length).toBe(1);
      const payload = meetingJoinedEvents[0].args[0] as { recordingState: { isRecording: boolean; isPaused: boolean } };
      expect(payload.recordingState).toBeDefined();
      expect(payload.recordingState.isRecording).toBe(true);
      expect(payload.recordingState.isPaused).toBe(false);

      // Also verify standalone recording:state was emitted
      const recStateEvents = findEvents(lateJoiner, "recording:state");
      expect(recStateEvents.length).toBeGreaterThanOrEqual(1);
      expect((recStateEvents[0].args[0] as { isRecording: boolean }).isRecording).toBe(true);

      // Clean up
      fireSocket(host, "recording:stop", { meetingCode });
    });

    it("verifies error handling for aberrant state transitions (pause when not active, double start)", async () => {
      clearParticipantSockets();
      resetRoomRecordingStates();

      const sock = makeFakeSocket("aberrant-sock", sharedSockets);
      const sockIdentity = {
        userId: "user_aberrant",
        participantId: "part_aberrant",
        name: "Aberrant User",
        role: "teacher" as const,
        meetingCode: null,
      };
      registerMeetingHandlers(sock.socket, sockIdentity);

      let joinDone = false;
      fireSocket(sock, "meeting:join", { meetingCode }, () => {
        joinDone = true;
      });
      await waitFor(() => joinDone, 5000);

      // 1. Pause when not active -> should return error
      let pauseRes: { ok: boolean; error?: string } | null = null;
      fireSocket(sock, "recording:pause", { meetingCode }, (res: unknown) => {
        pauseRes = res as { ok: boolean; error?: string };
      });
      expect(pauseRes!.ok).toBe(false);
      expect(pauseRes!.error).toContain("Recording is not active");

      // 2. Resume when not active -> should return error
      let resumeRes: { ok: boolean; error?: string } | null = null;
      fireSocket(sock, "recording:resume", { meetingCode }, (res: unknown) => {
        resumeRes = res as { ok: boolean; error?: string };
      });
      expect(resumeRes!.ok).toBe(false);
      expect(resumeRes!.error).toContain("Recording is not active");

      // 3. Start recording
      let start1State: { startedAt?: number } | null = null;
      fireSocket(sock, "recording:start", { meetingCode }, (res: unknown) => {
        start1State = (res as { state?: { startedAt?: number } })?.state ?? null;
      });
      const originalStartedAt = (start1State as { startedAt?: number } | null)?.startedAt;
      expect(originalStartedAt).toBeTypeOf("number");

      await new Promise((resolve) => setTimeout(resolve, 50));

      // 4. Double start recording:
      // Calling recording:start while recording is already active should preserve session
      let doubleStartRes: { ok: boolean; alreadyActive?: boolean; state?: { startedAt?: number } } | null = null;
      fireSocket(sock, "recording:start", { meetingCode }, (res: unknown) => {
        doubleStartRes = res as { ok: boolean; alreadyActive?: boolean; state?: { startedAt?: number } };
      });
      expect(doubleStartRes!.ok).toBe(true);
      expect(doubleStartRes!.alreadyActive).toBe(true);
      expect(doubleStartRes!.state?.startedAt).toBe(originalStartedAt);

      // Clean up
      fireSocket(sock, "recording:stop", { meetingCode });
    });
  });
});
